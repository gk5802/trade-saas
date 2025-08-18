// =======================================================
// File 9: src/middleware.ts
// Purpose: Global middleware to enforce security headers
// Depends on: security/headers.ts
// =======================================================

import { NextResponse } from "next/server"
import { securityHeaders } from "./security/headers"

export function middleware() {
  const res = NextResponse.next()

  // ✅ Apply all security headers
  for (const [key, value] of Object.entries(securityHeaders)) {
    res.headers.set(key, value)
  }

  return res
}

// ✅ Configure paths (optional: you can restrict if needed)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

