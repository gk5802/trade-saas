// =======================================================
// File 6: src/lib/sanitizer/strongSanitizer.ts
// Purpose: Ready-to-use SchemaField configs for common inputs
// Depends on: validator/index.ts, validator/schema.ts
// =======================================================

import { Validator } from "@/lib/validator"
import type { SchemaField } from "@/lib/validator/schema"

// Email field: required, normalize + validate format
export const EmailField: SchemaField = {
  validator: new Validator()
    .required()
    .string()
    .trim()
    .normalizeEmail()
    .email(),
  required: true,
  sanitize: true, // schema-level safeString() will run first
}

// Username field: required, min/max, HTML escape
export const UsernameField: SchemaField = {
  validator: new Validator()
    .required()
    .string()
    .trim()
    .min(3)
    .max(30)
    .escapeHtml(),
  required: true,
  sanitize: true,
}
