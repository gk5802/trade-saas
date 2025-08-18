/* eslint-disable @typescript-eslint/no-explicit-any */
// wkt3 custom validator types

// =======================================================
// File 1: src/lib/validator/types.ts
// Purpose: Shared type definitions for validators/sanitizers
// =======================================================

// -------------------
// 1. ValidationFn
// -------------------
// Each validator function receives a value and returns either:
// - null   → if value is valid
// - string → error message
export type ValidationFn = (value: any) => string | null

// Rule type definition

export type ValidationRule =
  | { type: "string" }
  | { type: "min"; value: number }
  | { type: "max"; value: number }
  | { type: "email" }
  | { type: "number" }
  | { type: "required" };


// ✅ Canonical ValidationResult (used everywhere)
export type ValidationResult = {
  valid: boolean
  value: any
  errors: string[]
  sanitized?: any
}

// Schema type (future: can hold multiple field validators)
export type ValidationSchema = {
  [field: string]: ValidationRule[];
};
export type SchemaValidationResult = {
  valid: boolean
  errors: Record<string, string[]>
}
// -------------------
// 2. SanitizerFn
// -------------------
// Each sanitizer function receives a value and must return
// a "safe" version of the value
export type SanitizerFn = (value: any) => any
