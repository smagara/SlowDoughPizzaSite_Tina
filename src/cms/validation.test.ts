import { describe, expect, it } from 'vitest';
import { LIMITS, normalizeText, slugify, validateDate, validatePrice, validateSlug, validateText, validateTextList } from './validation';

describe('validateText – script / markup handling', () => {
  it.each([
    ['<script>alert(1)</script>', 'Angle brackets'],
    ['Hello <b>world</b>', 'Angle brackets'],
    ['<img src=x onerror=alert(1)>', 'Angle brackets'],
    ['1 < 2', 'Angle brackets'],
    ['javascript:alert(1)', 'javascript:'],
    ['JaVaScRiPt : alert(1)', 'javascript:'],
    ['vbscript:msgbox', 'vbscript:'],
    ['data:text/html;base64,PHNjcmlwdD4=', 'data:text/html'],
    ['x" onclick=alert(1)', 'Event handler'],
    ['x onmouseover = alert(1)', 'Event handler'],
    ['&#60;script&#62;', 'Numeric HTML entities'],
    ['&#x3C;script&#x3E;', 'Numeric HTML entities'],
    ['\\u003cscript\\u003e', 'Escaped unicode'],
  ])('rejects %s', (input, fragment) => {
    expect(validateText(input)).toContain(fragment);
  });

  it('rejects control and invisible characters', () => {
    expect(validateText('Hello\u0000World')).toMatch(/Control characters/);
    expect(validateText('Hello\u0007')).toMatch(/Control characters/);
    expect(validateText('Hello\u200Bworld')).toMatch(/Invisible/);
    expect(validateText('Hello\u202Eworld')).toMatch(/Invisible/);
  });

  it('accepts ordinary pizzeria copy including punctuation and accents', () => {
    expect(validateText("Today's Dough: 72-Hour Cold Cellar Ferment")).toBeUndefined();
    expect(validateText('Mozzarella di Bufala Campana — flown in weekly & torn by hand (D.O.P.)')).toBeUndefined();
    expect(validateText('Doors open at 4:30 PM (Wed–Sun) • Walk-ins welcome')).toBeUndefined();
    expect(validateText('Cold cellar at 4°C / 38°F–40°F, 100% natural flour, $19')).toBeUndefined();
    expect(validateText('Castelfranco & Parmigiano; pane & olio. Onion = extra')).toBeUndefined();
  });

  it('enforces required and length rules', () => {
    expect(validateText('', { required: true })).toBe('This field is required.');
    expect(validateText('   ', { required: true })).toBe('This field is required.');
    expect(validateText(undefined, { required: true })).toBe('This field is required.');
    expect(validateText(undefined)).toBeUndefined();
    expect(validateText('a'.repeat(81), { max: LIMITS.short })).toMatch(/under 80 characters/);
    expect(validateText('a'.repeat(80), { max: LIMITS.short })).toBeUndefined();
    expect(validateText('ab', { min: 3 })).toMatch(/at least 3/);
    expect(validateText(42 as unknown as string)).toBe('Expected text.');
  });

  it('only allows line breaks in multiline fields', () => {
    expect(validateText('line one\nline two')).toMatch(/Line breaks/);
    expect(validateText('line one\nline two', { multiline: true })).toBeUndefined();
    expect(validateText('tab\there', { multiline: true })).toBeUndefined();
  });
});

describe('validateTextList', () => {
  it('validates each item and list bounds', () => {
    expect(validateTextList(['Vegan', 'Spicy'])).toBeUndefined();
    expect(validateTextList(['Vegan', '<i>x</i>'])).toMatch(/^Item 2: Angle brackets/);
    expect(validateTextList(['ok', ''])).toMatch(/^Item 2: This field is required/);
    expect(validateTextList(['a', 'b', 'c'], { maxItems: 2 })).toMatch(/2 item/);
    expect(validateTextList([], { minItems: 1 })).toMatch(/at least 1/);
    expect(validateTextList(undefined)).toBeUndefined();
    expect(validateTextList('nope')).toBe('Expected a list.');
  });
});

describe('validateSlug / slugify', () => {
  it('accepts kebab-case ids only', () => {
    expect(validateSlug('margherita-verace')).toBeUndefined();
    expect(validateSlug('item2')).toBeUndefined();
    expect(validateSlug('Margherita')).toMatch(/lowercase/);
    expect(validateSlug('a--b')).toMatch(/lowercase/);
    expect(validateSlug('has space')).toMatch(/lowercase/);
    expect(validateSlug('../etc/passwd')).toMatch(/lowercase/);
    expect(validateSlug('')).toBe('An identifier is required.');
    expect(validateSlug('', { required: false })).toBeUndefined();
    expect(validateSlug('a'.repeat(65))).toMatch(/64 characters/);
  });

  it('slugifies titles into safe filenames', () => {
    expect(slugify('Why We Only Use San Marzano Tomatoes!')).toBe('why-we-only-use-san-marzano-tomatoes');
    expect(slugify('  Crème Brûlée & Co.  ')).toBe('creme-brulee-co');
    expect(slugify('<script>alert(1)</script>')).toBe('script-alert-1-script');
    expect(slugify('../../etc/passwd')).toBe('etc-passwd');
    expect(validateSlug(slugify('A'.repeat(100)))).toBeUndefined();
  });
});

describe('validatePrice', () => {
  it('accepts sane menu prices', () => {
    expect(validatePrice(19)).toBeUndefined();
    expect(validatePrice(0)).toBeUndefined();
    expect(validatePrice(12.5)).toBeUndefined();
    expect(validatePrice('14')).toBeUndefined();
  });
  it('rejects bad prices', () => {
    expect(validatePrice(-1)).toMatch(/negative/);
    expect(validatePrice(1000)).toMatch(/999/);
    expect(validatePrice(9.999)).toMatch(/two decimal/);
    expect(validatePrice('abc')).toMatch(/number/);
    expect(validatePrice(undefined)).toMatch(/required/);
    expect(validatePrice(Infinity)).toMatch(/number/);
  });
});

describe('validateDate', () => {
  it('accepts ISO dates within a sensible range', () => {
    expect(validateDate('2026-09-14T00:00:00.000Z')).toBeUndefined();
    expect(validateDate('not a date')).toMatch(/valid date/);
    expect(validateDate('1999-01-01T00:00:00.000Z')).toMatch(/between 2000 and 2100/);
    expect(validateDate('')).toBe('A date is required.');
    expect(validateDate('', { required: false })).toBeUndefined();
  });
});

describe('normalizeText', () => {
  it('trims and collapses whitespace without altering meaning', () => {
    expect(normalizeText('  hello   world  ')).toBe('hello world');
    expect(normalizeText('a\r\nb\n\n\n\nc', { multiline: true })).toBe('a\nb\n\nc');
  });
});
