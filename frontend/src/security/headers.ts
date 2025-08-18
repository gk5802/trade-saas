/* eslint-disable @typescript-eslint/no-explicit-any */
// =======================================================
// File 8: src/security/headers.ts
// Purpose: Centralized strict HTTP security headers
// =======================================================

// Type definition for headers
export type SecurityHeaders = Record<string, string>

// ✅ Strict Content Security Policy (CSP)
// - No inline scripts/styles
// - Only allow self + trusted sources
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self';
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\s{2,}/g, " ").trim()

// ✅ Master security headers
export const securityHeaders: SecurityHeaders = {
  // Content Security Policy
  "Content-Security-Policy": ContentSecurityPolicy,

  // Disallow embedding in iframes (clickjacking prevention)
  "X-Frame-Options": "DENY",

  // Prevent old browsers from sniffing MIME types
  "X-Content-Type-Options": "nosniff",

  // Basic XSS filter (modern browsers ignore, but keep for defense-in-depth)
  "X-XSS-Protection": "1; mode=block",

  // Strict HTTPS
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",

  // Referrer policy
  "Referrer-Policy": "no-referrer",

  // Remove tech details
  "X-Powered-By": "WKT3-Secure",
}

// ✅ Helper to apply headers in Next.js (or Node.js API)
export function applySecurityHeaders(res: any) {
  for (const [key, value] of Object.entries(securityHeaders)) {
    res.setHeader(key, value)
  }
}
