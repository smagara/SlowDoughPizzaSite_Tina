import type { Collection, TinaField } from 'tinacms';

/**
 * Re-order an object's keys to match the schema's field order so that the JSON we commit produces
 * small, readable diffs in Pull Requests regardless of the order fields were edited in.
 */
export function orderBySchema(values: Record<string, unknown>, fields: TinaField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    if (!(field.name in values)) continue;
    const v = values[field.name];
    if (field.type === 'object' && 'fields' in field && Array.isArray(field.fields)) {
      const sub = field.fields as TinaField[];
      if (field.list && Array.isArray(v)) {
        out[field.name] = v.map((item) =>
          item && typeof item === 'object' ? orderBySchema(item as Record<string, unknown>, sub) : item,
        );
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        out[field.name] = orderBySchema(v as Record<string, unknown>, sub);
      } else {
        out[field.name] = v;
      }
    } else {
      out[field.name] = v;
    }
  }
  // Preserve any unknown keys at the end rather than silently dropping data.
  for (const [k, v] of Object.entries(values)) {
    if (!(k in out) && !k.startsWith('_')) out[k] = v;
  }
  return out;
}

/** Deterministic JSON for committing: 2-space indent and a trailing newline. */
export function serializeDocument(values: Record<string, unknown>, collection: Collection): string {
  const fields = (collection.fields ?? []) as TinaField[];
  return JSON.stringify(orderBySchema(values, fields), null, 2) + '\n';
}

/** Deep structural equality for plain JSON values. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === 'object') {
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const keys = new Set([...Object.keys(ao), ...Object.keys(bo)]);
    for (const k of keys) {
      if (!deepEqual(ao[k], bo[k])) return false;
    }
    return true;
  }
  return false;
}

export function deepClone<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}
