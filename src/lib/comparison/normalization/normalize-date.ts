/**
 * Phase 10 — Date Normalization Utility
 * Converts various date formats from OCR into a canonical YYYY-MM-DD string.
 */

const MONTH_MAP: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
  jan: '01', feb: '02', mar: '03', apr: '04',
  jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}

/**
 * Normalizes a raw date string into YYYY-MM-DD format.
 *
 * Handles:
 *   "January 5, 1998"
 *   "05/01/1998" (MM/DD/YYYY)
 *   "1998-01-05" (already ISO)
 *   "5 January 1998"
 *   "January 1998" → YYYY-MM only
 *   OCR artifacts like "01-01-1998"
 *
 * Returns null if the date cannot be parsed.
 */
export function normalizeDate(raw: string | null | undefined): string | null {
  if (!raw || raw.trim().length === 0) return null

  const cleaned = raw.trim().toLowerCase()

  // Already ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned

  // MM/DD/YYYY or DD/MM/YYYY (ambiguous — treat as MM/DD/YYYY for PH context)
  const slashMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (slashMatch) {
    const [, m, d, y] = slashMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // YYYY/MM/DD
  const ymdSlash = cleaned.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/)
  if (ymdSlash) {
    const [, y, m, d] = ymdSlash
    return `${y}-${m}-${d}`
  }

  // "January 5, 1998" or "5 January 1998"
  const writtenMonthFirst = cleaned.match(/^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/)
  if (writtenMonthFirst) {
    const [, monthStr, day, year] = writtenMonthFirst
    const month = MONTH_MAP[monthStr]
    if (month) return `${year}-${month}-${day.padStart(2, '0')}`
  }

  const writtenDayFirst = cleaned.match(/^(\d{1,2})\s+([a-z]+),?\s+(\d{4})$/)
  if (writtenDayFirst) {
    const [, day, monthStr, year] = writtenDayFirst
    const month = MONTH_MAP[monthStr]
    if (month) return `${year}-${month}-${day.padStart(2, '0')}`
  }

  // "January 1998" (no day — partial date)
  const partialMonth = cleaned.match(/^([a-z]+)\s+(\d{4})$/)
  if (partialMonth) {
    const [, monthStr, year] = partialMonth
    const month = MONTH_MAP[monthStr]
    if (month) return `${year}-${month}`
  }

  return null
}

/**
 * Returns true if two date strings represent the same date.
 * Normalizes both before comparing.
 */
export function datesMatch(a: string | null, b: string | null): boolean {
  const na = normalizeDate(a)
  const nb = normalizeDate(b)
  if (!na || !nb) return false
  // Compare only the portions that are present in both
  const len = Math.min(na.length, nb.length)
  return na.slice(0, len) === nb.slice(0, len)
}

/**
 * Returns true if a date is in the future (used for ID expiry validation).
 */
export function isDateExpired(raw: string | null): boolean {
  const normalized = normalizeDate(raw)
  if (!normalized) return false
  return normalized < new Date().toISOString().slice(0, 10)
}
