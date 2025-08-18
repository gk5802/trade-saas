/* eslint-disable @typescript-eslint/no-explicit-any */
// =======================================================
// File 3: src/lib/validator/schema.ts
// Depends on: types.ts, index.ts
// Purpose: Schema-level validator wrapper
// =======================================================

import { Validator } from "./index"
import { ValidationResult } from "./types"

export type SchemaField = {
  validator: Validator
  sanitize?: (v: any) => any
}

export type Schema = Record<string, SchemaField>

export function validateSchema(schema: Schema, data: Record<string, any>): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {}

  for (const key in schema) {
    const field = schema[key]
    let value = data[key]

    if (field.sanitize) {
      value = field.sanitize(value)
    }

    const result = field.validator.validate(value)
    results[key] = result
  }

  return results
}
