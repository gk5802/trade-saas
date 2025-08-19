// ====================================================
// File FE-2: src/app/api/auth/verify/route.ts
// Purpose: Proxy verification to Go backend, then return session
// Env: GO_API_BASE (e.g., http://localhost:8080)
// ====================================================
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const serial = req.nextUrl.searchParams.get("serial") || ""
  const token  = req.nextUrl.searchParams.get("token")  || ""

  if (!serial || !token) {
    return NextResponse.json({ error: "missing serial/token" }, { status: 400 })
  }

  const base = process.env.GO_API_BASE || "http://localhost:8080"
  const url  = `${base}/verify?serial=${encodeURIComponent(serial)}&token=${encodeURIComponent(token)}`

  // call Go backend verify
  const res = await fetch(url, { method: "GET" })
  const json = await res.json()

  if (!res.ok) {
    return NextResponse.json({ error: json?.error || "verify failed" }, { status: res.status })
  }

  // Optionally set HttpOnly cookies here for access/refresh
  // For demo, we return JSON
  return NextResponse.json(json, { status: 200 })
}
