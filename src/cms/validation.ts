/**
 * Shared content validation rules.
 *
 * These helpers are used in three places so the rules can never drift apart:
 *   1. `tina/schema.ts`  – as `ui.validate` callbacks inside the Tina CMS admin forms
 *   2. `src/cms/EditorApp` – the site-styled staff editor (client side, before a PR is opened)
 *   3. `src/cms/*.test.ts` / CI – every content file in `content/` is validated on each PR
 *
 * The site renders all content through React (which escapes text), so the rules below are a
 * defence-in-depth layer: they keep HTML/script fragments, URL schemes with executable payloads,
 * and control characters out of the content repository entirely – which also keeps the resulting
 * Pull Requests easy for a human reviewer to read.
 */

export interface TextRules {
  /** Maximum number of characters (after trimming). */
  max?: number;
  /** Minimum number of characters (after trimming). Defaults to 1 when `required`. */
  min?: number;
  /** Whether an empty value is an error. */
  required?: boolean;
  /** Allow line breaks (textarea style fields). */
  multiline?: boolean;
}

export const LIMITS = {
  short: 80, // names, headlines, labels
  medium: 200, // subtitles, excerpts, notes
  long: 600, // descriptions, list items
  paragraph: 2000, // a single article paragraph
} as const;

/** Patterns that are never acceptable inside free text. */
const FORBIDDEN_PATTERNS: Array<{ re: RegExp; message: string }> = [
  { re: /[<>]/, message: 'Angle brackets (< >) and HTML tags are not allowed.' },
  { re: /javascript\s*:/i, message: '"javascript:" URLs are not allowed.' },
  { re: /vbscript\s*:/i, message: '"vbscript:" URLs are not allowed.' },
  { re: /data\s*:\s*text\/html/i, message: 'Inline "data:text/html" content is not allowed.' },
  {
    // Angle brackets are already blocked, so this mainly keeps PRs free of suspicious fragments.
    re: /\bon(?:click|dbl?click|load|error|abort|mouse\w*|key\w*|focus\w*|blur|submit|change|input|animation\w*|transition\w*|pointer\w*|touch\w*|drag\w*|drop|scroll|wheel|toggle|contextmenu|copy|cut|paste|select|show|unload|beforeunload|hashchange|message|popstate|resize|readystatechange)\s*=/i,
    message: 'Event handler attributes (e.g. onclick=) are not allowed.',
  },
  { re: /&#x?[0-9a-f]+;?/i, message: 'Numeric HTML entities are not allowed.' },
  { re: /\\u00[0-9a-f]{2}/i, message: 'Escaped unicode sequences are not allowed.' },
];

// Control characters except TAB (0x09), LF (0x0A) and CR (0x0D) – handled separately.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
// eslint-disable-next-line no-control-regex
const LINE_BREAKS = /[\r\n]/;
// Zero-width and bidi override characters that can disguise content from a reviewer.
const INVISIBLE_CHARS = /[\u200B-\u200F\u2028-\u202E\u2060-\u2064\uFEFF]/;

/**
 * Validate a piece of free text. Returns an error message, or `undefined` when valid.
 */
export function validateText(value: unknown, rules: TextRules = {}): string | undefined {
  const { max = LIMITS.long, required = false, multiline = false } = rules;
  const min = rules.min ?? (required ? 1 : 0);

  if (value === undefined || value === null || value === '') {
    return required ? 'This field is required.' : undefined;
  }
  if (typeof value !== 'string') {
    return 'Expected text.';
  }

  const trimmed = value.trim();
  if (required && trimmed.length === 0) return 'This field is required.';
  if (trimmed.length < min) return `Please enter at least ${min} characters.`;
  if (trimmed.length > max) return `Please keep this under ${max} characters (currently ${trimmed.length}).`;

  if (CONTROL_CHARS.test(value)) return 'Control characters are not allowed.';
  if (INVISIBLE_CHARS.test(value)) return 'Invisible/zero-width characters are not allowed.';
  if (!multiline && LINE_BREAKS.test(value)) return 'Line breaks are not allowed in this field.';

  for (const { re, message } of FORBIDDEN_PATTERNS) {
    if (re.test(value)) return message;
  }
  return undefined;
}

/** Validate a list of short text values (tags, takeaways, paragraphs…). */
export function validateTextList(
  value: unknown,
  rules: TextRules & { maxItems?: number; minItems?: number } = {},
): string | undefined {
  const { maxItems = 50, minItems = 0, ...textRules } = rules;
  if (value === undefined || value === null) {
    return minItems > 0 ? `Please add at least ${minItems} item(s).` : undefined;
  }
  if (!Array.isArray(value)) return 'Expected a list.';
  if (value.length < minItems) return `Please add at least ${minItems} item(s).`;
  if (value.length > maxItems) return `Please keep this to ${maxItems} item(s) or fewer.`;
  for (let i = 0; i < value.length; i++) {
    const err = validateText(value[i], { ...textRules, required: true });
    if (err) return `Item ${i + 1}: ${err}`;
  }
  return undefined;
}

/** URL-safe identifier used for menu item ids, category ids and post filenames. */
export function validateSlug(value: unknown, { required = true } = {}): string | undefined {
  if (value === undefined || value === null || value === '') {
    return required ? 'An identifier is required.' : undefined;
  }
  if (typeof value !== 'string') return 'Expected text.';
  if (value.length > 64) return 'Identifiers must be 64 characters or fewer.';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    return 'Use only lowercase letters, numbers and single hyphens (e.g. "margherita-verace").';
  }
  return undefined;
}

/** Menu prices: whole or two-decimal dollars between 0 and 999. */
export function validatePrice(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return 'A price is required.';
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || Number.isNaN(n) || !Number.isFinite(n)) return 'Price must be a number.';
  if (n < 0) return 'Price cannot be negative.';
  if (n > 999) return 'Price must be 999 or less.';
  if (Math.round(n * 100) !== n * 100) return 'Price can have at most two decimal places.';
  return undefined;
}

/** ISO-8601 date (what Tina's `datetime` field stores). */
export function validateDate(value: unknown, { required = true } = {}): string | undefined {
  if (value === undefined || value === null || value === '') {
    return required ? 'A date is required.' : undefined;
  }
  if (typeof value !== 'string') return 'Expected a date.';
  const t = Date.parse(value);
  if (Number.isNaN(t)) return 'Please enter a valid date.';
  const year = new Date(t).getUTCFullYear();
  if (year < 2000 || year > 2100) return 'Please enter a date between 2000 and 2100.';
  return undefined;
}

/**
 * Convert a human title into a filename-safe slug. Used when staff create a new blog post.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/g, '');
}

/**
 * Normalise text before it is stored: trims, collapses runs of spaces and normalises line endings.
 * This does NOT try to "clean" dangerous input – invalid input is rejected, not silently rewritten.
 */
export function normalizeText(value: string, { multiline = false } = {}): string {
  let v = value.replace(/\r\n?/g, '\n');
  if (!multiline) v = v.replace(/\s+/g, ' ');
  else v = v.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n');
  return v.trim();
}
