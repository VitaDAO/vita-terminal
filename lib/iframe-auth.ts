import crypto from 'crypto';

/**
 * Generate an iframe authentication token for a given origin
 * Token is valid for the current day only
 */
export function generateIframeToken(origin: string, secret: string): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
  return crypto
    .createHmac('sha256', secret)
    .update(origin + today)
    .digest('hex');
}

/**
 * Verify an iframe authentication token
 */
export function verifyIframeToken(token: string, origin: string, secret: string): boolean {
  try {
    const expectedToken = generateIframeToken(origin, secret);
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(expectedToken, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Get the iframe URL with authentication token
 */
export function getAuthenticatedIframeUrl(baseUrl: string, origin: string, secret: string): string {
  const token = generateIframeToken(origin, secret);
  const url = new URL(baseUrl);
  url.searchParams.set('iframe_token', token);
  return url.toString();
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.some(allowed => {
    const cleanAllowed = allowed.replace('https://', '').replace('http://', '');
    const cleanOrigin = origin.replace('https://', '').replace('http://', '');
    return cleanOrigin.includes(cleanAllowed) || cleanAllowed.includes(cleanOrigin);
  });
}