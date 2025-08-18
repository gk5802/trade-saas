/* eslint-disable @typescript-eslint/no-explicit-any */
// =======================================================
// File 13: src/security/unicodeSanitizer.ts
// Purpose: Normalize + detect malicious Unicode characters
// Prevent homoglyph attacks, invisible chars, mixed scripts
// =======================================================

import { ValidationResult } from "@/lib/validator/types"




// =======================================================
// 1. Normalize Unicode safely
// =======================================================
export function normalizeUnicode(input: string): string {
  // NFC: canonical composition (safe normalization)
  return input.normalize("NFC")
}

// =======================================================
// 2. Detect suspicious Unicode
// =======================================================
export function detectSuspiciousUnicode(input: string): string[] {
  const issues: string[] = []

  // Zero-width & control chars
  const zeroWidth = /[\u200B-\u200D\uFEFF]/g
  if (zeroWidth.test(input)) {
    issues.push("Contains zero-width or hidden characters")
  }

  // Mixed scripts (Cyrillic + Latin, etc.)
  const hasLatin = /[A-Za-z]/.test(input)
  const hasCyrillic = /[\u0400-\u04FF]/.test(input)
  const hasArabic = /[\u0600-\u06FF]/.test(input)
  const hasHan = /[\u4E00-\u9FFF]/.test(input)

  const scriptCount = [hasLatin, hasCyrillic, hasArabic, hasHan].filter(Boolean).length
  if (scriptCount > 1) {
    issues.push("Contains mixed-language scripts (possible spoofing)")
  }

  return issues
}
// =======================================================
// File 7: src/lib/sanitizer/unicodeSanitizer.ts
// Purpose: Prevent Unicode-based attacks (homoglyphs, RTL)
// =======================================================


export function sanitizeUnicode(input: string): ValidationResult {
  let sanitized = ""
  const errors: string[] = []

  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    const code = input.charCodeAt(i)

    if (code >= 0x202A && code <= 0x202E) {
      errors.push("Disallowed Unicode control character")
      continue
    }

    if (code < 32 || code > 126) {
      errors.push(`Removed suspicious character: U+${code.toString(16)}`)
      continue
    }

    sanitized += char
  }

  return {
    valid: errors.length === 0,
    value: sanitized,
    sanitized,
    errors,
  }
}
