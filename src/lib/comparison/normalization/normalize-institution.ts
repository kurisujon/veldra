/**
 * Phase 10 — Institution Name Normalization Utility
 * Normalizes school and employer names for fuzzy comparison.
 */

const INSTITUTION_NOISE = [
  'the', 'of', 'and', 'a', 'an', 'inc', 'corp', 'co', 'ltd',
  'university', 'college', 'institute', 'school', 'academy',
  'foundation', 'polytechnic', 'state', 'national', 'city',
  'municipal', 'provincial', 'corporation', 'company',
]

/**
 * Normalizes an institution name by removing noise words,
 * uppercasing, and stripping punctuation.
 */
export function normalizeInstitution(raw: string | null | undefined): string | null {
  if (!raw || raw.trim().length === 0) return null

  const tokens = raw
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(t => t.length > 0 && !INSTITUTION_NOISE.includes(t.toLowerCase()))

  return tokens.join(' ').trim() || null
}

/**
 * Returns true if two institution names likely refer to the same entity.
 * Uses token overlap ratio — handles abbreviations (e.g., "UST" vs "University of Santo Tomas").
 */
export function institutionsMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false

  // Check acronym match: extract initials of each significant word
  const acronymA = toAcronym(a)
  const acronymB = toAcronym(b)
  if (acronymA && acronymB && acronymA === acronymB) return true

  const na = normalizeInstitution(a)
  const nb = normalizeInstitution(b)
  if (!na || !nb) return false

  // If one is contained within the other (e.g., "DLSU" inside "DE LA SALLE UNIVERSITY")
  if (na.includes(nb) || nb.includes(na)) return true

  const tokensA = new Set(na.split(' '))
  const tokensB = new Set(nb.split(' '))

  let overlap = 0
  for (const t of tokensA) {
    if (tokensB.has(t)) overlap++
  }

  const ratio = overlap / Math.max(tokensA.size, tokensB.size)
  return ratio >= 0.5
}

function toAcronym(name: string): string | null {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .split(' ')
    .filter(w => w.length > 0 && !INSTITUTION_NOISE.includes(w.toLowerCase()))

  if (words.length < 2) return null
  return words.map(w => w[0]).join('')
}
