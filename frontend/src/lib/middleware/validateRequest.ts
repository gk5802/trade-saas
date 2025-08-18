/* eslint-disable @typescript-eslint/no-explicit-any */
// =======================================================
// File 7: src/lib/middleware/validateRequest.ts
// Purpose: Plug schema validation into API routes
// Usage: wrap API handlers with schema validation
// Depends on: validator/schema.ts
// =======================================================

import type { NextApiRequest, NextApiResponse } from "next"
import type { SchemaField } from "@/lib/validator/schema"
import { validateSchema } from "@/lib/validator/schema"

export function withValidation(
  schema: Record<string, SchemaField>,
  handler: (req: NextApiRequest, res: NextApiResponse, data: any) => void | Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const data = req.method === "GET" ? req.query : req.body

    const result = validateSchema(schema, data)

    if (!result.valid) {
      return res.status(400).json({ success: false, errors: result.errors })
    }

    // pass cleaned data to handler
    return handler(req, res, result.sanitized)
  }
}
