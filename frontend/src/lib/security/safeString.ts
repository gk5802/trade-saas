// ================================================
// wkt3 — S-3: safeString utilities
// File: frontend/src/lib/security/safeString.ts
// Purpose: Unicode-safe sanitizers + helpers used across validator & app
// Serial: S-3.*  (S-3.1..S-3.9 represent grouped functions)
// ================================================

/**
 * Notes:
 * - Designed to be small, dependency-free, and safe across languages.
 * - Functions return the cleaned value (or boolean/metadata for detectors).
 * - Use these in validator sanitizers (validator.trim(), .removeScripts(), etc.)
 */

/* -------------------------
   S-3.1: Unicode Normalization
   ------------------------- */
export function normalizeUnicode(input: string): string {
  // Use NFC (canonical composed form) which is commonly recommended
  // for storing and comparing Unicode strings.
  if (typeof input !== "string") return input
  return input.normalize("NFC")
}

/* -------------------------
   S-3.2: Remove Zero-Width & Invisible Chars
   ------------------------- */
const ZERO_WIDTH_REGEX =
  /[\u200B\u200C\u200D\uFEFF\u2060\u180E\u00AD\u200E\u200F]/g
export function removeZeroWidth(input: string): string {
  if (typeof input !== "string") return input
  return input.replace(ZERO_WIDTH_REGEX, "")
}

/* -------------------------
   S-3.3: Strip Control Characters
   ------------------------- */
const CONTROL_CHARS_REGEX = /[\x00-\x1F\x7F-\x9F]/g
export function stripControlChars(input: string): string {
  if (typeof input !== "string") return input
  // Keep common whitespace (tab/newline) if you want — for now remove all control chars
  return input.replace(CONTROL_CHARS_REGEX, "")
}

/* -------------------------
   S-3.4: Basic HTML Escape (for rendering as text)
   ------------------------- */
export function escapeHtml(input: string): string {
  if (typeof input !== "string") return input
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

/* -------------------------
   S-3.5: Strip Tags (remove HTML tags entirely)
   ------------------------- */
export function stripTags(input: string): string {
  if (typeof input !== "string") return input
  // Remove tags, but keep their textual content
  return input.replace(/<[^>]*>/g, "")
}

/* -------------------------
   S-3.6: Remove <script> blocks (and their content)
   ------------------------- */
export function removeScriptBlocks(input: string): string {
  if (typeof input !== "string") return input
  // Remove <script ...> ... </script> blocks (case-insensitive, dot matches newlines)
  return input.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
}

/* -------------------------
   S-3.7: Safe filename (strip dangerous chars)
   ------------------------- */
export function sanitizeFilename(input: string, replaceWith = "_"): string {
  if (typeof input !== "string") return input
  // Normalize, remove zero-width/control, then remove path separators & unsafe chars.
  let s = normalizeUnicode(input)
  s = removeZeroWidth(s)
  s = stripControlChars(s)
  // Remove directory traversal and most unsafe chars
  s = s.replace(/(\.{2}\/|\\)/g, "")
  s = s.replace(/[<>:"|?*\x00-\x1F]/g, replaceWith)
  // Trim leading/trailing dots/spaces
  s = s.replace(/^\.+/, "").replace(/\.+$/, "")
  s = s.trim()
  return s || "file"
}

/* -------------------------
   S-3.8: URL-safe encode for path segments (no external libs)
   ------------------------- */
export function encodeUrlSegment(input: string): string {
  if (typeof input !== "string") return input
  // Use built-in encodeURIComponent but normalize and remove zero-width first
  const s = normalizeUnicode(input)
  return encodeURIComponent(removeZeroWidth(stripControlChars(s)))
}

/* -------------------------
   S-3.9: Suspicious Unicode detector
   - Detect mixed-script suspiciousness and presence of homoglyphs / non-printables
   - Returns a simple score and list of flags (not perfect, but useful as heuristic).
   ------------------------- */

// =======================================================
// File 5: src/lib/security/safeString.ts
// Purpose: Safe string handling, Unicode anomaly detection, sanitization
// =======================================================

/**
 * Detect suspicious Unicode patterns (like mixed scripts that might be used
 * for phishing, homoglyph attacks, or hidden virus-like payloads).
 */
export function detectSuspiciousUnicode(input: string): boolean {
  if (!input) return false

  let scriptLatin = false
  let scriptCyrillic = false
  let scriptArabic = false
  let suspicious = false

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i)

    if (code >= 0x0041 && code <= 0x007A) scriptLatin = true
    if (code >= 0x0400 && code <= 0x04FF) scriptCyrillic = true
    if (code >= 0x0600 && code <= 0x06FF) scriptArabic = true

    // Extra check: disallow control chars
    if (code < 32 || (code >= 127 && code <= 159)) {
      suspicious = true
    }
  }

  // Mixed-script detection (Latin + Cyrillic / Arabic mixed is dangerous)
  if ((scriptLatin && scriptCyrillic) || (scriptLatin && scriptArabic)) {
    suspicious = true
  }

  return suspicious
}


/* -------------------------
   S-3.10: Convenience sanitizer pipeline
   - Allows you to create a common pipeline used by validator sanitizers
   ------------------------- */
export function strongSanitize(input: string): string {
  if (typeof input !== "string") return input
  let s = normalizeUnicode(input)
  s = removeZeroWidth(s)
  s = stripControlChars(s)
  s = removeScriptBlocks(s)
  s = stripTags(s) // remove tags after scripts removed
  s = s.trim()
  return s
}

/* -------------------------
   S-3.11: Example safe usage helpers for validator
   ------------------------- */
/**
 * Use this inside Validator sanitizers, e.g.
 *   .sanitizer((v) => sanitizeForUsername(v))
 */
export function sanitizeForUsername(input: string): string {
  // Normalize, remove invisibles and control chars, allow only letters/numbers/_-.
  let s = normalizeUnicode(input)
  s = removeZeroWidth(s)
  s = stripControlChars(s)
  s = s.trim()
  // replace spaces with underscore
  s = s.replace(/\s+/g, "_")
  // remove any char that is not letter/number/_/-
  s = s.replace(/[^0-9A-Za-z_\-]/g, "")
  // final trim
  return s
}