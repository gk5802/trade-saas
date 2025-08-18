/* eslint-disable @typescript-eslint/no-explicit-any */
// =======================================================
// File 2: src/lib/validator/index.ts
// Depends on: types.ts (File 1)
// Purpose: Provides Validator class + ValidationResult type
// =======================================================

import { ValidationFn, SanitizerFn } from "./types"

// ✅ Single source of truth for validation results
export type ValidationResult = {
  valid: boolean
  errors: string[]
  sanitized: any
}

// ✅ Core Validator class
export class Validator {
  private validators: ValidationFn[] = []
  private sanitizers: SanitizerFn[] = []

  private static readonly htmlMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }

  // 1) Add sanitizers
  sanitize(fn: SanitizerFn): this {
    this.sanitizers.push(fn)
    return this
  }

  // 2) Basic rules
  required(msg = "This field is required"): this {
    this.validators.push((v) => {
      if (v === undefined || v === null || v === "") return msg
      return null
    })
    return this
  }

  string(msg = "Must be a string"): this {
    this.validators.push((v) => (typeof v !== "string" ? msg : null))
    return this
  }

  number(msg = "Must be a number"): this {
    this.validators.push((v) => (typeof v !== "number" ? msg : null))
    return this
  }

  boolean(msg = "Must be true/false"): this {
    this.validators.push((v) => (typeof v !== "boolean" ? msg : null))
    return this
  }

  email(msg = "Invalid email format"): this {
    this.validators.push((v) =>
      typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        ? null
        : msg
    )
    return this
  }

  // 3) String length
  min(len: number, msg?: string): this {
    this.validators.push((v) =>
      typeof v === "string" && v.length >= len
        ? null
        : msg || `Must be at least ${len} characters`
    )
    return this
  }

  max(len: number, msg?: string): this {
    this.validators.push((v) =>
      typeof v === "string" && v.length <= len
        ? null
        : msg || `Must be at most ${len} characters`
    )
    return this
  }

  // 4) Built-in sanitizers
  trim(): this {
    this.sanitizers.push((v) => (typeof v === "string" ? v.trim() : v))
    return this
  }

  escapeHtml(): this {
    this.sanitizers.push((v) =>
      typeof v === "string"
        ? v.replace(/[&<>"']/g, (c) => Validator.htmlMap[c] || c)
        : v
    )
    return this
  }

  normalizeEmail(): this {
    this.sanitizers.push((v) =>
      typeof v === "string" ? v.trim().toLowerCase() : v
    )
    return this
  }

  // 5) Run all checks
  validate(value: any): ValidationResult {
    let sanitized = value

    for (const fn of this.sanitizers) {
      sanitized = fn(sanitized)
    }

    const errors: string[] = []
    for (const fn of this.validators) {
      const err = fn(sanitized)
      if (err) errors.push(err)
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized,
    }
  }
}
