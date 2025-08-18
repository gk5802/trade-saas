// =======================================================
// File 12: src/security/auditLogger.ts
// Purpose: Centralized security audit logging
// =======================================================

import fs from "fs"
import path from "path"
import crypto from "crypto"

// =======================================================
// 1. Config
// =======================================================
const LOG_DIR = path.join(process.cwd(), "logs")
const AUDIT_FILE = path.join(LOG_DIR, "audit.log")

// Ensure logs dir exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

// =======================================================
// 2. Audit event type
// =======================================================
export type AuditEvent = {
  timestamp: string
  type: "LOGIN_SUCCESS" | "LOGIN_FAILURE" | "REGISTER" | "SUSPICIOUS" | "ADMIN_ACTION"
  ip?: string
  userId?: string
  details?: string
  hash?: string // integrity protection
}

// =======================================================
// 3. Compute integrity hash (chain logging)
// =======================================================
function computeHash(event: Omit<AuditEvent, "hash">, prevHash: string): string {
  const str = JSON.stringify(event) + prevHash
  return crypto.createHash("sha256").update(str).digest("hex")
}

// =======================================================
// 4. Write log entry
// =======================================================
export function logAuditEvent(event: Omit<AuditEvent, "timestamp" | "hash">) {
  const timestamp = new Date().toISOString()

  // read last line hash
  let prevHash = "GENESIS"
  if (fs.existsSync(AUDIT_FILE)) {
    const lines = fs.readFileSync(AUDIT_FILE, "utf8").trim().split("\n")
    const last = lines[lines.length - 1]
    if (last) {
      try {
        const parsed = JSON.parse(last)
        prevHash = parsed.hash || prevHash
      } catch {
        // ignore malformed line
      }
    }
  }

  const baseEvent = { ...event, timestamp }
  const hash = computeHash(baseEvent, prevHash)
  const finalEvent: AuditEvent = { ...baseEvent, hash }

  fs.appendFileSync(AUDIT_FILE, JSON.stringify(finalEvent) + "\n", "utf8")
}

// =======================================================
// 5. Example usage
// =======================================================
// logAuditEvent({ type: "LOGIN_FAILURE", ip: "192.168.1.10", details: "Wrong password" })
// logAuditEvent({ type: "SUSPICIOUS", userId: "user123", details: "Multiple failed attempts" })
