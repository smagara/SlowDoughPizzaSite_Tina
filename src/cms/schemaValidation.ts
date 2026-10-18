import type { Collection, TinaField } from 'tinacms';
import { validateDate } from './validation';

export interface FieldError {
  /** Dot/bracket path, e.g. "categories[1].items[0].price". */
  path: string;
  message: string;
}

type AnyField = TinaField & {
  list?: boolean;
  required?: boolean;
  options?: Array<string | { value: string; label?: string }>;
  fields?: TinaField[];
  ui?: { validate?: (value: unknown, all: Record<string, unknown>, meta: unknown, field: unknown) => unknown };
};

const isEmpty = (v: unknown) =>
  v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

function optionValues(field: AnyField): string[] | undefined {
  if (!field.options) return undefined;
  return field.options.map((o) => (typeof o === 'string' ? o : o.value));
}

function validateScalar(field: AnyField, value: unknown, path: string, errors: FieldError[]) {
  switch (field.type) {
    case 'string':
    case 'image':
    case 'reference': {
      if (typeof value !== 'string') {
        errors.push({ path, message: 'Expected text.' });
        return;
      }
      const opts = optionValues(field);
      if (opts && !opts.includes(value)) {
        errors.push({ path, message: `Must be one of: ${opts.join(', ')}.` });
      }
      return;
    }
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        errors.push({ path, message: 'Expected a number.' });
      }
      return;
    case 'boolean':
      if (typeof value !== 'boolean') errors.push({ path, message: 'Expected true or false.' });
      return;
    case 'datetime': {
      const err = validateDate(value, { required: !!field.required });
      if (err) errors.push({ path, message: err });
      return;
    }
    default:
      return;
  }
}

function validateFields(
  fields: TinaField[],
  values: Record<string, unknown>,
  basePath: string,
  errors: FieldError[],
) {
  const known = new Set<string>();
  for (const raw of fields) {
    const field = raw as AnyField;
    known.add(field.name);
    const value = values?.[field.name];
    const path = basePath ? `${basePath}.${field.name}` : field.name;

    if (field.required && isEmpty(value)) {
      errors.push({ path, message: 'This field is required.' });
    }

    if (!isEmpty(value)) {
      if (field.type === 'object') {
        const sub = (field.fields ?? []) as TinaField[];
        if (field.list) {
          if (!Array.isArray(value)) {
            errors.push({ path, message: 'Expected a list.' });
          } else {
            value.forEach((item, i) => {
              if (!item || typeof item !== 'object' || Array.isArray(item)) {
                errors.push({ path: `${path}[${i}]`, message: 'Expected an object.' });
              } else {
                validateFields(sub, item as Record<string, unknown>, `${path}[${i}]`, errors);
              }
            });
          }
        } else if (!value || typeof value !== 'object' || Array.isArray(value)) {
          errors.push({ path, message: 'Expected an object.' });
        } else {
          validateFields(sub, value as Record<string, unknown>, path, errors);
        }
      } else if (field.list) {
        if (!Array.isArray(value)) {
          errors.push({ path, message: 'Expected a list.' });
        } else {
          value.forEach((item, i) => validateScalar(field, item, `${path}[${i}]`, errors));
        }
      } else {
        validateScalar(field, value, path, errors);
      }
    }

    const validate = field.ui?.validate;
    if (typeof validate === 'function') {
      let result: unknown;
      try {
        result = validate(value, values, {}, field);
      } catch (e) {
        result = e instanceof Error ? e.message : 'Invalid value.';
      }
      if (typeof result === 'string' && result) errors.push({ path, message: result });
    }
  }

  for (const key of Object.keys(values ?? {})) {
    if (!known.has(key) && !key.startsWith('_')) {
      errors.push({ path: basePath ? `${basePath}.${key}` : key, message: `Unknown field "${key}".` });
    }
  }
}

/**
 * Validate a whole document against its collection schema. Returns an empty array when valid.
 * Used by the staff editor (before submit), by tests, and by CI for every file in `content/`.
 */
export function validateDocument(collection: Collection, values: unknown): FieldError[] {
  const errors: FieldError[] = [];
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    return [{ path: '', message: 'Document must be a JSON object.' }];
  }
  validateFields((collection.fields ?? []) as TinaField[], values as Record<string, unknown>, '', errors);
  // De-duplicate identical messages (e.g. built-in "required" + schema validate).
  const seen = new Set<string>();
  return errors.filter((e) => {
    const key = `${e.path}::${e.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Group errors by path for quick lookup in forms. */
export function errorsByPath(errors: FieldError[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of errors) if (!out[e.path]) out[e.path] = e.message;
  return out;
}
