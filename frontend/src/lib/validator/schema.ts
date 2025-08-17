/* eslint-disable @typescript-eslint/no-explicit-any */
// =======================================================
// File 3: src/lib/validator/schema.ts
// Depends on: index.ts (File 2)
// Purpose: Provides schema-level validation
// =======================================================

import { Validator, ValidationResult } from "./index"

export class Schema {
  private shape: Record<string, Validator>

  constructor(shape: Record<string, Validator>) {
    this.shape = shape
  }

  validate(obj: Record<string, any>): {
    valid: boolean
    value: Record<string, any>
    sanitized: Record<string, any>
    errors: Record<string, string[]>
  } {
    const value: Record<string, any> = {}
    const sanitized: Record<string, any> = {}
    const errors: Record<string, string[]> = {}
    let valid = true

    for (const key of Object.keys(this.shape)) {
      const validator = this.shape[key]
      const res: ValidationResult = validator.validate(obj[key])

      value[key] = res.value
      sanitized[key] = res.sanitized ?? res.value
      if (!res.valid) {
        valid = false
        errors[key] = res.errors
      }
    }

    return { valid, value, sanitized, errors }
  }
}
