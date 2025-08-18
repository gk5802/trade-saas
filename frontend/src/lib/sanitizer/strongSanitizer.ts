/* eslint-disable @typescript-eslint/no-explicit-any */
// =======================================================
// File 6: src/lib/sanitizer/strongSanitizer.ts
// Purpose: Specialized strong sanitizers for common fields
// Depends on: validator/index.ts (Validator), validator/schema.ts (SchemaField)
// =======================================================

import { Validator } from "@/lib/validator"
import { SchemaField } from "@/lib/validator/schema"

// =======================================================
// 6.1 Email
// =======================================================
export const EmailField: SchemaField = {
  validator: new Validator()
    .required("Email is required")
    .string()
    .trim()
    .normalizeEmail()
    .email(),
}

// =======================================================
// 6.2 Username
// - Must be alphanumeric + underscores only
// - Min 3, Max 30 chars
// =======================================================
export const UsernameField: SchemaField = {
  validator: new Validator()
    .required("Username is required")
    .string()
    .trim()
    .min(3)
    .max(30)
    .sanitize((v) =>
      typeof v === "string" ? v.replace(/[^a-zA-Z0-9_]/g, "") : v
    ),
}

// =======================================================
// 6.3 Password
// - At least 8 chars
// - Must contain uppercase, lowercase, number, special char
// - Sanitizer: trims spaces only (don’t modify real password)
// =======================================================
export const PasswordField: SchemaField = {
  validator: new Validator()
    .required("Password is required")
    .string()
    .min(8, "Password must be at least 8 characters")
    .sanitize((v) => (typeof v === "string" ? v.trim() : v))
    .sanitize((v) => {
      if (typeof v !== "string") return v
      const hasUpper = /[A-Z]/.test(v)
      const hasLower = /[a-z]/.test(v)
      const hasNumber = /[0-9]/.test(v)
      const hasSpecial = /[^A-Za-z0-9]/.test(v)
      if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        throw new Error(
          "Password must contain upper, lower, number, and special character"
        )
      }
      return v
    }),
}

// =======================================================
// 6.4 URL
// - Must be valid HTTP/HTTPS URL
// =======================================================
export const URLField: SchemaField = {
  validator: new Validator()
    .required("URL is required")
    .string()
    .trim()
    .sanitize((v) => {
      if (typeof v !== "string") return v
      try {
        const url = new URL(v)
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Only HTTP/HTTPS URLs allowed")
        }
        return url.toString()
      } catch {
        throw new Error("Invalid URL format")
      }
    }),
}

// =======================================================
// 6.5 IP Address
// - Must be valid IPv4 or IPv6
// =======================================================
export const IPField: SchemaField = {
  validator: new Validator()
    .required("IP is required")
    .string()
    .trim()
    .sanitize((v) => {
      if (typeof v !== "string") return v
      const ipv4 =
        /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/
      const ipv6 =
        /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9]))$/
      if (ipv4.test(v) || ipv6.test(v)) return v
      throw new Error("Invalid IP address")
    }),
}
// =======================================================
// 6.6 PhoneNumberField (E.164 format, +countrycodeXXXXXXXX)
// =======================================================
export const PhoneNumberField: SchemaField = {
  validator: new Validator().string().trim(),
  sanitize: (v: any) =>
    typeof v === "string" && /^\+?[1-9]\d{7,14}$/.test(v.trim())
      ? v.trim()
      : v,
}

// =======================================================
// 6.7 UUIDField (v4 standard)
// =======================================================
export const UUIDField: SchemaField = {
  validator: new Validator().string().trim(),
  sanitize: (v: any) =>
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v.trim()
    )
      ? v.trim()
      : v,
}

// =======================================================
// 6.8 TokenField (JWT-like, API keys, session tokens)
// - Only allow [A-Za-z0-9._-]
// =======================================================
export const TokenField: SchemaField = {
  validator: new Validator().string().trim(),
  sanitize: (v: any) =>
    typeof v === "string" && /^[A-Za-z0-9._-]{10,}$/.test(v.trim())
      ? v.trim()
      : v,
}