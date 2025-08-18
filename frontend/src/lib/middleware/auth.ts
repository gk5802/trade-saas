// =======================================================
// File 9: src/middleware/auth.ts
// Purpose: Authentication + Role-based Access Control (RBAC)
// Depends on: JWT utils (we’ll build in src/lib/auth/jwt.ts)
// =======================================================

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyJwt } from "@/lib/auth/jwt"

// ----------------------------
// 1. Define roles
// ----------------------------
export type UserRole = "superadmin" | "admin" | "manager" | "employee"

const protectedRoutes: Record<string, UserRole[]> = {
  "/api/admin": ["admin", "superadmin"],
  "/api/manage": ["manager", "admin", "superadmin"],
  "/api/employee": ["employee", "manager", "admin", "superadmin"],
}

// ----------------------------
// 2. Extract token
// ----------------------------
function getToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

  const cookieToken = req.cookies.get("token")
  if (cookieToken) return cookieToken.value

  return null
}

// ----------------------------
// 3. Auth middleware
// ----------------------------
export async function authMiddleware(req: NextRequest) {
  const token = getToken(req)
  const urlPath = req.nextUrl.pathname

  // 3.1 Require token
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  // 3.2 Verify JWT
  let payload: { id: string; role: UserRole } | null = null
  try {
    payload = await verifyJwt(token)
  } catch {
    return new NextResponse("Invalid token", { status: 401 })
  }

  if (!payload) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  // 3.3 Role-based check
  for (const route in protectedRoutes) {
    if (urlPath.startsWith(route)) {
      const allowedRoles = protectedRoutes[route]
      if (!allowedRoles.includes(payload.role)) {
        return new NextResponse("Forbidden", { status: 403 })
      }
    }
  }

  // Continue request
  return NextResponse.next()
}

// ----------------------------
// 4. Apply only to /api routes
// ----------------------------
export const config = {
  matcher: ["/api/:path*"],
}
