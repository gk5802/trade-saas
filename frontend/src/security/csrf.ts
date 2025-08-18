// =======================================================
// File 11: src/security/csrf.ts
// Purpose: CSRF token generator & validator
// =======================================================

import crypto from "crypto"

export type CsrfToken = {
  token: string
  expires: number
}

// =======================================================
// 1. Config
// =======================================================
const CSRF_SECRET = process.env.CSRF_SECRET || "change-this-secret"
const CSRF_TTL = 60 * 60 * 1000 // 1 hour

// =======================================================
// 2. Create token (per session/user)
// =======================================================
export function createCsrfToken(sessionId: string): CsrfToken {
  const expires = Date.now() + CSRF_TTL

  const raw = `${sessionId}:${expires}:${CSRF_SECRET}`
  const hash = crypto.createHash("sha256").update(raw).digest("hex")

  return {
    token: `${expires}:${hash}`,
    expires,
  }
}

// =======================================================
// 3. Validate token
// =======================================================
export function validateCsrfToken(sessionId: string, token: string): boolean {
  if (!token) return false

  const [expStr, hash] = token.split(":")
  const expires = parseInt(expStr, 10)

  if (Date.now() > expires) return false // expired

  const expectedRaw = `${sessionId}:${expires}:${CSRF_SECRET}`
  const expectedHash = crypto.createHash("sha256").update(expectedRaw).digest("hex")

  return hash === expectedHash
}

// =======================================================
// 4. Example usage
// =======================================================
// Server generates token on GET form/page load:
// const { token } = createCsrfToken(session.id)
//
// Client submits token with POST request (e.g., hidden field / header).
//
// On POST, server calls:
// if (!validateCsrfToken(session.id, tokenFromClient)) rejectRequest()
