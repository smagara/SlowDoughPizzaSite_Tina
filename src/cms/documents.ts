import type { Collection } from 'tinacms';

/** A single editable content file. */
export interface CmsDocument {
  /** Tina collection name, e.g. "post". */
  collection: string;
  /** File name relative to the collection path, e.g. "importance-of-dough-aging.json". */
  relativePath: string;
  /** Parsed JSON content (without Tina's private `_collection` / `_template` keys). */
  values: Record<string, unknown>;
  /** Git blob sha of the file at load time (GitHub mode) – used for conflict detection. */
  sha?: string;
}

export interface ChangeSet {
  upserts: CmsDocument[];
  deletes: CmsDocument[];
}

export type SubmitResult =
  | { kind: 'local-saved'; files: string[] }
  | { kind: 'pull-request'; url: string; number: number; branch: string; files: string[] };

export interface SubmitMeta {
  /** Short title, used as the PR title / commit subject. */
  title: string;
  /** Markdown description – the human readable change summary. */
  description: string;
}

/** Whether a collection holds a single, fixed document (announcement, menu, hours). */
export function isSingleton(collection: Collection): boolean {
  return collection.ui?.allowedActions?.create === false;
}

/** Repository path for a document, e.g. "content/posts/foo.json". */
export function documentPath(collection: Collection, relativePath: string): string {
  return `${collection.path.replace(/\/+$/, '')}/${relativePath}`;
}

/** Strip Tina's private metadata keys from a `_values` payload. */
export function stripPrivateKeys(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (!k.startsWith('_')) out[k] = v;
  }
  return out;
}
