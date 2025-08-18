// =======================================================
// File 8: src/middleware/security.ts
// Purpose: Security middleware for Next.js (rate limit, CSRF, headers)
// =======================================================

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// ----------------------------
// 1. Rate Limiting (per IP)
// ----------------------------
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>()
const MAX_REQUESTS = 100 // per window
const WINDOW_MS = 60 * 1000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry) {
    rateLimitMap.set(ip, { count: 1, lastRequest: now })
    return true
  }

  if (now - entry.lastRequest > WINDOW_MS) {
    // reset window
    rateLimitMap.set(ip, { count: 1, lastRequest: now })
    return true
  }

  entry.count++
  entry.lastRequest = now

  if (entry.count > MAX_REQUESTS) {
    return false
  }

  return true
}

// ----------------------------
// 2. CSRF Protection (basic)
// ----------------------------
function checkCsrf(req: NextRequest): boolean {
  const origin = req.headers.get("origin")
  const host = req.headers.get("host")

  if (!origin || !host) return true // skip check if missing

  try {
    const url = new URL(origin)
    if (url.host !== host) return false
  } catch {
    return false
  }

  return true
}

// ----------------------------
// 3. Security Headers
// ----------------------------
function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff")
  res.headers.set("X-Frame-Options", "DENY")
  res.headers.set("X-XSS-Protection", "1; mode=block")
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'"
  )
  return res
}

// ----------------------------
// 4. Extract IP (safe)
// ----------------------------
function getIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  return "127.0.0.1" // fallback
}

// ----------------------------
// 5. Middleware Export
// ----------------------------
export function middleware(req: NextRequest) {
  const ip = getIp(req)

  // Rate limit
  if (!checkRateLimit(ip)) {
    return new NextResponse("Too many requests", { status: 429 })
  }

  // CSRF
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    if (!checkCsrf(req)) {
      return new NextResponse("CSRF validation failed", { status: 403 })
    }
  }

  // Continue request
  const res = NextResponse.next()
  return applySecurityHeaders(res)
}

// ----------------------------
// 6. Apply only to API routes
// ----------------------------
export const config = {
  matcher: ["/api/:path*"],
}
