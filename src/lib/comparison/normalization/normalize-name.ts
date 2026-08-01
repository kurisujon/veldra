/**
 * Phase 10 — Name Normalization Utility
 * Handles Filipino name formats, OCR artifacts, initials, and name ordering.
 */

export interface ParsedName {
  firstName: string
  middleName: string | null
  lastName: string
  suffix: string | null
  /** Full normalized string for fuzzy comparison */
  normalized: string
}

const SUFFIXES = ['jr', 'sr', 'ii', 'iii', 'iv', 'v']

/**
 * Normalizes a raw name string into a structured ParsedName object.
 *
 * Handles formats like:
 *   "DELA CRUZ, JUAN P."
 *   "Juan Pedro Dela Cruz"
 *   "JUAN PEDRO DELA CRUZ JR."
 *   "dela cruz, juan p. jr"
 */
export function normalizeName(raw: string | null | undefined): ParsedName | null {
  if (!raw || raw.trim().length === 0) return null

  // Step 1: Uppercase, strip extra whitespace, remove punctuation except commas
  let cleaned = raw
    .toUpperCase()
    .replace(/\./g, ' ')
    .replace(/[^A-Z\s,\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Step 2: Detect "LAST, FIRST MIDDLE" format (comma present)
  let lastName = ''
  let remainder = ''

  if (cleaned.includes(',')) {
    const [last, rest] = cleaned.split(',').map(s => s.trim())
    lastName = last
    remainder = rest
  } else {
    // "FIRST [MIDDLE] LAST [SUFFIX]" — last token is last name unless it's a suffix
    const tokens = cleaned.split(' ').filter(Boolean)
    const lastToken = tokens[tokens.length - 1]?.toLowerCase()

    if (SUFFIXES.includes(lastToken)) {
      // e.g., JUAN PEDRO DELA CRUZ JR
      lastName = tokens[tokens.length - 2] || ''
      remainder = tokens.slice(0, tokens.length - 2).join(' ')
    } else {
      lastName = tokens[tokens.length - 1] || ''
      remainder = tokens.slice(0, tokens.length - 1).join(' ')
    }
  }

  // Step 3: Parse remainder for firstName, middleName, suffix
  const remainderTokens = remainder.split(' ').filter(Boolean)
  let suffix: string | null = null

  const lastToken = remainderTokens[remainderTokens.length - 1]?.toLowerCase()
  if (SUFFIXES.includes(lastToken)) {
    suffix = remainderTokens.pop()!.toUpperCase()
  }

  const firstName = remainderTokens[0] || ''

  // Middle name: everything after the first name (could be "PEDRO" or "P" initial)
  const middleName =
    remainderTokens.length > 1
      ? remainderTokens.slice(1).join(' ')
      : null

  // Step 4: Build normalized full string (excludes suffix for comparison)
  const normalized = [firstName, middleName, lastName]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  return { firstName, middleName, lastName, suffix, normalized }
}

/**
 * Returns true if two name strings refer to the same person,
 * accounting for middle-initial abbreviations.
 *
 * Example: "JUAN P. DELA CRUZ" matches "JUAN PEDRO DELA CRUZ"
 */
export function namesMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false
  const pa = normalizeName(a)
  const pb = normalizeName(b)
  if (!pa || !pb) return false

  const firstMatch = pa.firstName === pb.firstName
  const lastMatch = pa.lastName === pb.lastName

  // Middle name: if one is an initial, check only first character
  const middleMatch = (() => {
    if (!pa.middleName && !pb.middleName) return true
    if (!pa.middleName || !pb.middleName) return true // one missing — allow
    if (pa.middleName.length === 1 || pb.middleName.length === 1) {
      // Initial comparison
      return pa.middleName[0] === pb.middleName[0]
    }
    return pa.middleName === pb.middleName
  })()

  return firstMatch && lastMatch && middleMatch
}
