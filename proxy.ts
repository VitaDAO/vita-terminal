import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";
import crypto from 'crypto';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/iframe-token") || pathname.startsWith("/api/chat")) {
    return NextResponse.next();
  }

  // Check if this is an iframe request
  const isIframe = request.headers.get('sec-fetch-dest') === 'iframe';
  const rawOrigin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/');
  const allowedOrigins = process.env.ALLOWED_IFRAME_ORIGINS?.split(',') || [];
  const hasIframeToken = request.nextUrl.searchParams.has('iframe_token');

  // Block all direct access - only allow iframe access from allowed origins
  if (!isIframe || !rawOrigin || !allowedOrigins.some(allowed => rawOrigin.includes(allowed.replace('https://', '').replace('http://', '')))) {
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Access Restricted - Vita Terminal</title>
          <style>
            body { 
              font-family: system-ui; 
              background: #000; 
              color: #fff; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0;
            }
            .container { text-align: center; max-width: 500px; padding: 2rem; }
            h1 { color: #ff6b6b; margin-bottom: 1rem; font-size: 1.5rem; }
            p { color: #aaa; line-height: 1.6; margin-bottom: 1rem; }
            .logo { font-size: 2rem; margin-bottom: 2rem; }
            a { color: #4CAF50; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🔒</div>
            <h1>Access Restricted</h1>
            <p>The Vita Terminal can only be accessed through authorized websites.</p>
            <p>Please visit <a href="https://vitadao.com" target="_top"><strong>vitadao.com</strong></a> to access the terminal.</p>
            ${!isIframe ? '<p><small>Direct access is not permitted.</small></p>' : '<p><small>Unauthorized origin detected.</small></p>'}
          </div>
        </body>
      </html>
    `, {
      status: 403,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }

  // Iframe authentication check for allowed origins
  if (isIframe) {
    const iframeAuthSecret = process.env.IFRAME_AUTH_SECRET;
    
    // Get auth token from query params or headers
    const authToken = request.nextUrl.searchParams.get('iframe_token') || request.headers.get('x-iframe-token');
    
    // Verify iframe token if secret is configured
    if (iframeAuthSecret && authToken && rawOrigin) {
      try {
        console.log('Verifying token for origin:', rawOrigin);
        const expectedToken = crypto
          .createHmac('sha256', iframeAuthSecret)
          .update(rawOrigin + new Date().toISOString().slice(0, 10)) // Daily token
          .digest('hex');
          
        console.log('Expected token:', expectedToken.substring(0, 10) + '...');
        console.log('Received token:', authToken.substring(0, 10) + '...');
          
        if (authToken !== expectedToken) {
          console.log('Iframe access denied - invalid token');
          return new NextResponse('Invalid iframe token', { status: 403 });
        }
        
        console.log('✅ Token validated successfully');
      } catch (error) {
        console.log('Iframe token verification failed:', error);
        return new NextResponse('Token verification failed', { status: 403 });
      }
    }
    
    // Set iframe-specific headers and allow unauthenticated access
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Content-Security-Policy', `frame-ancestors ${allowedOrigins.join(' ')};`);
    
    // Skip normal auth for iframe requests - allow unauthenticated access
    return response;
  }

  // Optional: Get token for context but don't block unauthenticated users
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  // Only redirect authenticated users away from auth pages
  const isGuest = guestRegex.test(token?.email ?? "");
  if (token && !isGuest && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Allow unauthenticated access to all terminal functionality

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
