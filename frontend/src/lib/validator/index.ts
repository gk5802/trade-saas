/* eslint-disable @typescript-eslint/no-explicit-any */
// =======================================================
// File 2: src/lib/validator/index.ts
// Depends on: types.ts (File 1)
// Purpose: Provides Validator class
// =======================================================

import { ValidationFn, SanitizerFn, ValidationResult } from "./types"

// ✅ Core Validator class
export class Validator {
  private validators: ValidationFn[] = []
  private sanitizers: SanitizerFn[] = []

  sanitize(fn: SanitizerFn): this {
    this.sanitizers.push(fn)
    return this
  }

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

  trim(): this {
    this.sanitizers.push((v) => (typeof v === "string" ? v.trim() : v))
    return this
  }

  escapeHtml(): this {
    this.sanitizers.push((v) =>
      typeof v === "string"
        ? v.replace(/[&<>"']/g, (c) =>
            (
              {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              } as Record<string, string>
            )[c] || c
          )
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
      value: sanitized,
      sanitized,
      errors,
    }
  }
}
