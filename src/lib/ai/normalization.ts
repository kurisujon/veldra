/**
 * Field normalization for the Veldra extraction pipeline.
 *
 * Normalizes raw extracted values into canonical forms for:
 * - Dates → YYYY-MM-DD ISO format
 * - Names → Preserved spelling with consistent casing
 * - Identifiers → Cleaned whitespace
 *
 * Preserves the raw value for auditability while producing
 * a normalized value for comparison logic.
 */

import type { ExtractedField } from './types';

// ---------------------------------------------------------------------------
// Normalization Entry Point
// ---------------------------------------------------------------------------

/**
 * Normalizes all fields in an extraction result.
 * Produces normalized values while preserving raw values for auditability.
 */
export function normalizeFields(
  fields: Record<string, ExtractedField>,
  documentType: string
): Record<string, ExtractedField> {
  const normalized: Record<string, ExtractedField> = {};

  for (const [fieldName, field] of Object.entries(fields)) {
    normalized[fieldName] = normalizeField(fieldName, field, documentType);
  }

  return normalized;
}

// ---------------------------------------------------------------------------
// Single Field Normalization
// ---------------------------------------------------------------------------

function normalizeField(
  fieldName: string,
  field: ExtractedField,
  _documentType: string
): ExtractedField {
  if (field.value === null || field.value === undefined) {
    return field;
  }

  const value = String(field.value);
  const name = fieldName.toLowerCase();

  let normalizedValue = value;

  // Date normalization
  if (isDateField(name)) {
    const normalized = normalizeDate(value);
    if (normalized) {
      normalizedValue = normalized;
    }
  }
  // Name normalization
  else if (isNameField(name)) {
    normalizedValue = normalizeName(value);
  }
  // Identifier normalization
  else if (isIdentifierField(name)) {
    normalizedValue = normalizeIdentifier(value);
  }
  // General text normalization
  else {
    normalizedValue = normalizeText(value);
  }

  return {
    ...field,
    // The `value` field holds the normalized value going forward
    // The `sourceText` retains what was actually read from the document
    value: normalizedValue,
  };
}

// ---------------------------------------------------------------------------
// Field Type Detection
// ---------------------------------------------------------------------------

function isDateField(fieldName: string): boolean {
  return (
    fieldName.includes('date') ||
    fieldName === 'dateofbirth' ||
    fieldName === 'dateofregistration' ||
    fieldName === 'dateofmarriage' ||
    fieldName === 'dateawarded' ||
    fieldName === 'dateofgraduation' ||
    fieldName === 'issuedate' ||
    fieldName === 'expirydate' ||
    fieldName === 'executiondate' ||
    fieldName === 'duedate' ||
    fieldName === 'statementdate'
  );
}

function isNameField(fieldName: string): boolean {
  return (
    fieldName.includes('name') ||
    fieldName.includes('firstname') ||
    fieldName.includes('middlename') ||
    fieldName.includes('lastname') ||
    fieldName.includes('suffix')
  );
}

function isIdentifierField(fieldName: string): boolean {
  return (
    fieldName.includes('number') ||
    fieldName.includes('registry') ||
    fieldName.includes('certificate') ||
    fieldName.includes('tin') ||
    fieldName.includes('lrn') ||
    fieldName.includes('studentnumber') ||
    fieldName.includes('accountnumber')
  );
}

// ---------------------------------------------------------------------------
// Date Normalization
// ---------------------------------------------------------------------------

const MONTH_MAP: Record<string, string> = {
  january: '01', jan: '01',
  february: '02', feb: '02',
  march: '03', mar: '03',
  april: '04', apr: '04',
  may: '05',
  june: '06', jun: '06',
  july: '07', jul: '07',
  august: '08', aug: '08',
  september: '09', sep: '09', sept: '09',
  october: '10', oct: '10',
  november: '11', nov: '11',
  december: '12', dec: '12',
};

/**
 * Normalizes various date formats to ISO YYYY-MM-DD.
 * Returns null if the date cannot be parsed.
 */
function normalizeDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // "January 15, 2000" or "January 15 2000"
  const monthDayYear = trimmed.match(
    /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/
  );
  if (monthDayYear) {
    const month = MONTH_MAP[monthDayYear[1].toLowerCase()];
    if (month) {
      const day = monthDayYear[2].padStart(2, '0');
      return `${monthDayYear[3]}-${month}-${day}`;
    }
  }

  // "15 January 2000"
  const dayMonthYear = trimmed.match(
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/
  );
  if (dayMonthYear) {
    const month = MONTH_MAP[dayMonthYear[2].toLowerCase()];
    if (month) {
      const day = dayMonthYear[1].padStart(2, '0');
      return `${dayMonthYear[3]}-${month}-${day}`;
    }
  }

  // "01/15/2000" or "01-15-2000" (MM/DD/YYYY — common in Philippines)
  const slashDate = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashDate) {
    const a = parseInt(slashDate[1], 10);
    const b = parseInt(slashDate[2], 10);
    const year = slashDate[3];

    // If first number > 12, it must be day (DD/MM/YYYY)
    if (a > 12) {
      return `${year}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
    }
    // Otherwise assume MM/DD/YYYY (PH convention follows US format)
    return `${year}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
  }

  // "15/01/00" or "01/15/00" with 2-digit year
  const shortYear = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (shortYear) {
    const yearNum = parseInt(shortYear[3], 10);
    const fullYear = yearNum > 50 ? `19${shortYear[3]}` : `20${shortYear[3]}`;
    const a = parseInt(shortYear[1], 10);
    const b = parseInt(shortYear[2], 10);
    if (a > 12) {
      return `${fullYear}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
    }
    return `${fullYear}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
  }

  // If no pattern matches, return null (don't destroy the raw value)
  return null;
}

// ---------------------------------------------------------------------------
// Name Normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes names while preserving original spelling.
 * - Trims whitespace
 * - Normalizes multiple spaces to single space
 * - Preserves original casing from document
 * - Preserves hyphens, apostrophes, periods, suffixes
 */
function normalizeName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ');         // Collapse multiple spaces
  // Deliberately do NOT change casing — preserve document spelling
}

// ---------------------------------------------------------------------------
// Identifier Normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes identifiers (registry numbers, certificate numbers, etc.)
 */
function normalizeIdentifier(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ');
}

// ---------------------------------------------------------------------------
// General Text Normalization
// ---------------------------------------------------------------------------

/**
 * General text normalization for non-specific fields.
 */
function normalizeText(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ');
}
