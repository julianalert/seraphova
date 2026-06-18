/** Strip HTML tags and trim whitespace from user-supplied strings */
export function sanitizeText(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')   // strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
    .trim()
    .slice(0, maxLength);
}

/** Validate and normalise an email address */
export function sanitizeEmail(value: unknown): string {
  const email = sanitizeText(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '';
  return email;
}

/** Validate a YYYY-MM-DD date string */
export function sanitizeDate(value: unknown): string {
  const d = sanitizeText(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return d;
}

/** Validate a HH:MM time string */
export function sanitizeTime(value: unknown): string | null {
  const t = sanitizeText(value, 5);
  if (!t) return null;
  if (!/^\d{2}:\d{2}$/.test(t)) return null;
  return t;
}

/** Validate focus_areas array — only allow known values */
const ALLOWED_FOCUS = new Set(['love', 'career', 'self', 'transitions', 'health', 'decisions']);

export function sanitizeFocusAreas(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string' && ALLOWED_FOCUS.has(v))
    .slice(0, 3);
}

/** Validate delivery_time */
const ALLOWED_TIMES = new Set(['6am', '7am', '8am', '9am']);

export function sanitizeDeliveryTime(value: unknown): string {
  const t = sanitizeText(value, 3);
  return ALLOWED_TIMES.has(t) ? t : '7am';
}
