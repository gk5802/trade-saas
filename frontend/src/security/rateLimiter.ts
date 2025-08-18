// =======================================================
// File 10: src/security/rateLimiter.ts
// Purpose: Simple in-memory rate limiting & throttling
// =======================================================

type RateLimitKey = string

export type RateLimitOptions = {
  windowMs: number  // Time window (ms)
  max: number       // Max requests per window
}

type RecordEntry = {
  count: number
  expires: number
}

// ✅ Simple in-memory store (can later move to Redis for scale)
const store: Map<RateLimitKey, RecordEntry> = new Map()

// =======================================================
// getKey() → combines IP + optional userId for unique limiter
// =======================================================
function getKey(ip: string, userId?: string): string {
  return userId ? `user:${userId}` : `ip:${ip}`
}

// =======================================================
// rateLimiter() → main function
// =======================================================
export function rateLimiter(
  ip: string,
  userId: string | undefined,
  opts: RateLimitOptions
): { allowed: boolean; remaining: number; reset: number } {
  const key = getKey(ip, userId)
  const now = Date.now()

  const record = store.get(key)

  if (record && record.expires > now) {
    // still inside the window
    if (record.count >= opts.max) {
      return { allowed: false, remaining: 0, reset: record.expires - now }
    }

    record.count++
    store.set(key, record)

    return {
      allowed: true,
      remaining: opts.max - record.count,
      reset: record.expires - now,
    }
  }

  // new window
  store.set(key, { count: 1, expires: now + opts.windowMs })

  return {
    allowed: true,
    remaining: opts.max - 1,
    reset: opts.windowMs,
  }
}

// =======================================================
// Example wrapper for login attempts (brute force prevention)
// =======================================================
export function limitLogin(ip: string, userId?: string) {
  return rateLimiter(ip, userId, {
    windowMs: 60_000, // 1 minute
    max: 5,           // max 5 attempts per minute
  })
}

// =======================================================
// Example wrapper for API requests
// =======================================================
export function limitApi(ip: string, userId?: string) {
  return rateLimiter(ip, userId, {
    windowMs: 15 * 60_000, // 15 minutes
    max: 100,              // max 100 requests
  })
}
