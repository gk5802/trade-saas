import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// TODO: replace with real Go DB integration
const mockDB: Record<string, string> = {}

const PROTECTED = new Set(["POST", "PUT", "PATCH", "DELETE"])

export function middleware(req: NextRequest) {
  if (!PROTECTED.has(req.method)) return NextResponse.next()

  const headerSerial = req.headers.get("x-csrf-serial") || ""
  const cookieSerial = req.cookies.get("session-id")?.value || ""

  if (!headerSerial || !cookieSerial || headerSerial !== cookieSerial) {
    return new NextResponse("CSRF validation failed", { status: 403 })
  }

  const token = mockDB[cookieSerial]
  if (!token) {
    return new NextResponse("CSRF token missing/expired", { status: 403 })
  }

  // burn token after use
  delete mockDB[cookieSerial]

  return NextResponse.next()
}
