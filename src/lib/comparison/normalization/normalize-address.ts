/**
 * Phase 10 — Address Normalization Utility
 * Strips noise tokens and normalizes Philippine addresses for comparison.
 */

const NOISE_TOKENS = [
  'unit', 'rm', 'room', 'floor', 'flr', 'fl', 'blk', 'block',
  'lot', 'phase', 'building', 'bldg', 'suite', 'ste',
  'st', 'street', 'ave', 'avenue', 'road', 'rd', 'drive', 'dr',
  'brgy', 'barangay', 'city', 'municipality', 'province', 'region',
  'philippines', 'ph', 'metro',
]

/**
 * Normalizes a raw address string for comparison.
 * Removes noise tokens, punctuation, extra spaces, and uppercases everything.
 */
export function normalizeAddress(raw: string | null | undefined): string | null {
  if (!raw || raw.trim().length === 0) return null

  const tokens = raw
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(t => t.length > 0 && !NOISE_TOKENS.includes(t.toLowerCase()))

  return tokens.join(' ').trim() || null
}

/**
 * Returns true if two addresses likely refer to the same location.
 * Uses token overlap ratio — not exact matching.
 */
export function addressesMatch(a: string | null, b: string | null): boolean {
  const na = normalizeAddress(a)
  const nb = normalizeAddress(b)
  if (!na || !nb) return false

  const tokensA = new Set(na.split(' '))
  const tokensB = new Set(nb.split(' '))

  let overlap = 0
  for (const t of tokensA) {
    if (tokensB.has(t)) overlap++
  }

  const ratio = overlap / Math.max(tokensA.size, tokensB.size)
  return ratio >= 0.6 // 60% token overlap = same address
}
