/* eslint-disable @typescript-eslint/no-explicit-any */
// =======================================================
// File 3: src/lib/validator/schema.ts
// Purpose: Schema-level validation + sanitization
// Exports: validateSchema, Schema, SchemaField
// Depends on: validator/index.ts, security/safeString.ts
// =======================================================

import { Validator, ValidationResult } from "./index"
import { safeString } from "../security/safeString"

// Shape of a field in a schema
export type SchemaField = {
  validator: Validator | { validate: (value: any) => ValidationResult }
  required?: boolean
  sanitize?: boolean        // default true for strings
  defaultValue?: any
}

// Output of schema validation
export type SchemaOutput = {
  valid: boolean
  errors: Record<string, string>
  values: Record<string, any>     // schema-level value (post safeString)
  sanitized: Record<string, any>  // field-level sanitized (from validator)
}

function runFieldValidator(v: SchemaField["validator"], value: any): ValidationResult {
  if (v instanceof Validator) return v.validate(value)
  return v.validate(value)
}

// ✅ Named export your code imports
export function validateSchema(
  schema: Record<string, SchemaField>,
  data: Record<string, any>
): SchemaOutput {
  const errors: Record<string, string> = {}
  const values: Record<string, any> = {}
  const sanitized: Record<string, any> = {}

  for (const key in schema) {
    const def = schema[key]
    let raw = data[key]

    if (raw === undefined && def.defaultValue !== undefined) {
      raw = def.defaultValue
    }

    if (def.required && (raw === undefined || raw === null || raw === "")) {
      errors[key] = `${key} is required`
      continue
    }

    let val = raw
    if (def.sanitize !== false && typeof val === "string") {
      val = safeString(val)
    }

    const res = runFieldValidator(def.validator, val)
    if (!res.valid) {
      errors[key] = res.errors.join(", ") || `${key} is invalid`
    }

    values[key] = val
    sanitized[key] = res.sanitized !== undefined ? res.sanitized : val
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values,
    sanitized,
  }
}

// Optional OO wrapper
export class Schema {
  constructor(private shape: Record<string, SchemaField>) {}
  validate(data: Record<string, any>): SchemaOutput {
    return validateSchema(this.shape, data)
  }
}
