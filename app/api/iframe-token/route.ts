import { NextRequest, NextResponse } from 'next/server';
import { generateIframeToken, isOriginAllowed } from '@/lib/iframe-auth';

// CORS headers helper
function getCorsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigins = process.env.ALLOWED_IFRAME_ORIGINS?.split(',') || [];

  if (isOriginAllowed(origin, allowedOrigins)) {
    return new NextResponse(null, {
      status: 200,
      headers: getCorsHeaders(origin),
    });
  }

  return new NextResponse(null, { status: 403 });
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.searchParams.get('origin') || request.headers.get('origin') || '';
  const allowedOrigins = process.env.ALLOWED_IFRAME_ORIGINS?.split(',') || [];
  const iframeAuthSecret = process.env.IFRAME_AUTH_SECRET;

  if (!origin) {
    return NextResponse.json({ error: 'Origin parameter required' }, { 
      status: 400,
      headers: getCorsHeaders(origin) 
    });
  }

  if (!iframeAuthSecret) {
    return NextResponse.json({ error: 'Iframe authentication not configured' }, { 
      status: 500,
      headers: getCorsHeaders(origin) 
    });
  }

  if (!isOriginAllowed(origin, allowedOrigins)) {
    return NextResponse.json({ error: 'Origin not allowed' }, { 
      status: 403,
      headers: getCorsHeaders(origin) 
    });
  }

  try {
    const token = generateIframeToken(origin, iframeAuthSecret);
    
    return NextResponse.json({ 
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      origin 
    }, {
      headers: getCorsHeaders(origin)
    });
  } catch (error) {
    console.error('Token generation failed:', error);
    return NextResponse.json({ error: 'Token generation failed' }, { 
      status: 500,
      headers: getCorsHeaders(origin) 
    });
  }
}

export async function POST(request: NextRequest) {
  const requestOrigin = request.headers.get('origin') || '';
  
  try {
    const { origin } = await request.json();
    const allowedOrigins = process.env.ALLOWED_IFRAME_ORIGINS?.split(',') || [];
    const iframeAuthSecret = process.env.IFRAME_AUTH_SECRET;

    if (!origin) {
      return NextResponse.json({ error: 'Origin required' }, { 
        status: 400,
        headers: getCorsHeaders(requestOrigin) 
      });
    }

    if (!iframeAuthSecret) {
      return NextResponse.json({ error: 'Iframe authentication not configured' }, { 
        status: 500,
        headers: getCorsHeaders(requestOrigin) 
      });
    }

    if (!isOriginAllowed(origin, allowedOrigins)) {
      return NextResponse.json({ error: 'Origin not allowed' }, { 
        status: 403,
        headers: getCorsHeaders(requestOrigin) 
      });
    }

    const token = generateIframeToken(origin, iframeAuthSecret);
    
    return NextResponse.json({ 
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      origin 
    }, {
      headers: getCorsHeaders(requestOrigin)
    });
  } catch (error) {
    console.error('Token generation failed:', error);
    return NextResponse.json({ error: 'Invalid request' }, { 
      status: 400,
      headers: getCorsHeaders(requestOrigin) 
    });
  }
}