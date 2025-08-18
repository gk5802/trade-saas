/* eslint-disable @typescript-eslint/no-explicit-any */
// =======================================================
// File 10: src/lib/auth/jwt.ts
// Purpose: Custom JWT signing & verification (HS256)
// Depends on: Node.js crypto
// =======================================================

import crypto from "crypto"

// ----------------------------
// 1. Base64URL helpers
// ----------------------------
function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function base64UrlDecode(input: string): Buffer {
  input = input.replace(/-/g, "+").replace(/_/g, "/")
  while (input.length % 4) input += "="
  return Buffer.from(input, "base64")
}

// ----------------------------
// 2. Secret Key (secure, replace in prod)
// ----------------------------
const SECRET = process.env.JWT_SECRET || "super-secret-key-change-me"

// ----------------------------
// 3. Sign JWT
// ----------------------------
export function signJwt(payload: object, expiresInSec = 3600): string {
  const header = { alg: "HS256", typ: "JWT" }

  const exp = Math.floor(Date.now() / 1000) + expiresInSec
  const body = { ...payload, exp }

  const headerEnc = base64UrlEncode(JSON.stringify(header))
  const bodyEnc = base64UrlEncode(JSON.stringify(body))

  const data = `${headerEnc}.${bodyEnc}`
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")

  return `${data}.${signature}`
}

// ----------------------------
// 4. Verify JWT
// ----------------------------
export function verifyJwt<T = any>(token: string): T {
  const parts = token.split(".")
  if (parts.length !== 3) throw new Error("Invalid JWT")

  const [headerEnc, bodyEnc, sig] = parts
  const data = `${headerEnc}.${bodyEnc}`

  const expectedSig = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")

  if (expectedSig !== sig) {
    throw new Error("Invalid signature")
  }

  const payload = JSON.parse(base64UrlDecode(bodyEnc).toString("utf8"))

  if (payload.exp && Date.now() / 1000 > payload.exp) {
    throw new Error("Token expired")
  }

  return payload as T
}

// ----------------------------
// 5. Decode JWT (no verify)
// ----------------------------
export function decodeJwt<T = any>(token: string): T | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const bodyEnc = parts[1]
    return JSON.parse(base64UrlDecode(bodyEnc).toString("utf8")) as T
  } catch {
    return null
  }
}
