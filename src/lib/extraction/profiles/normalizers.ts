import { NormalizationStrategy } from './types';

export function normalizePersonName(name: string | null | undefined): string | null {
  if (!name) return null;
  return name.trim().toUpperCase().replace(/\s+/g, ' ');
}

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

export function normalizeDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

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

  const slashDate = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashDate) {
    const a = parseInt(slashDate[1], 10);
    const b = parseInt(slashDate[2], 10);
    const year = slashDate[3];

    if (a > 12) {
      return `${year}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
    }
    return `${year}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
  }

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

  // Fallback to strict parsing if everything else fails but it looks like a valid string
  const clean = trimmed.toUpperCase();
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return clean;
}

export function normalizeIdNumber(idStr: string | null | undefined): string | null {
  if (!idStr) return null;
  return idStr.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

export function normalizeAddress(addr: string | null | undefined): string | null {
  if (!addr) return null;
  return addr.trim().toUpperCase().replace(/\s+/g, ' ');
}

export function normalizeText(text: string | null | undefined): string | null {
  if (!text) return null;
  return text.trim();
}

export function normalizeExact(text: string | null | undefined): string | null {
  return text || null;
}

export function applyNormalization(
  value: string | null | undefined, 
  strategy: NormalizationStrategy
): string | null {
  if (!value) return null;
  switch (strategy) {
    case 'PERSON_NAME': return normalizePersonName(value);
    case 'DATE': return normalizeDate(value);
    case 'ID_NUMBER': return normalizeIdNumber(value);
    case 'ADDRESS': return normalizeAddress(value);
    case 'TEXT': return normalizeText(value);
    case 'EXACT': return normalizeExact(value);
    default: return normalizeExact(value);
  }
}
