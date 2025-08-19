import type { NextApiRequest, NextApiResponse } from "next"
import crypto from "crypto"

// TODO: replace with real Go DB integration
const mockDB: Record<string, string> = {}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" })
  }

  const serial = Date.now().toString() + "-" + Math.floor(Math.random() * 1000)
  const token = crypto.randomBytes(32).toString("hex")

  // store in DB (mocked here)
  mockDB[serial] = token

  // set only serial in cookie (not token!)
  res.setHeader("Set-Cookie", [
    `session-id=${serial}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=600`,
  ])

  return res.status(200).json({ ok: true, serial })
}
