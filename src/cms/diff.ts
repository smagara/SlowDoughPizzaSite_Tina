import type { Collection, TinaField } from 'tinacms';
import type { ChangeSet, CmsDocument } from './documents';
import { deepEqual } from './serialize';

export interface ChangeLine {
  /** Human readable location, e.g. "Daily Menu › Neapolitan Pizzas › Margherita › Price". */
  label: string;
  before?: string;
  after?: string;
  kind: 'added' | 'removed' | 'changed';
}

type AnyField = TinaField & { list?: boolean; fields?: TinaField[]; ui?: { itemProps?: (item: any) => { label?: string } } };

const fmt = (v: unknown): string => {
  if (v === undefined || v === null || v === '') return '(empty)';
  if (typeof v === 'string') return v.length > 80 ? `${v.slice(0, 77)}…` : v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.length === 0 ? '(empty list)' : v.map(fmt).join(' | ');
  return JSON.stringify(v);
};

function itemLabel(field: AnyField, item: unknown, index: number): string {
  try {
    const l = field.ui?.itemProps?.(item)?.label;
    if (l) return String(l);
  } catch {
    /* ignore */
  }
  if (item && typeof item === 'object') {
    const o = item as Record<string, unknown>;
    for (const k of ['title', 'name', 'day', 'sectionHeading', 'id']) {
      if (typeof o[k] === 'string' && o[k]) return o[k] as string;
    }
  }
  return `#${index + 1}`;
}

function diffFields(
  fields: TinaField[],
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown> | undefined,
  prefix: string[],
  out: ChangeLine[],
) {
  for (const raw of fields) {
    const field = raw as AnyField;
    const b = before?.[field.name];
    const a = after?.[field.name];
    if (deepEqual(b, a)) continue;
    const fieldLabel = typeof field.label === 'string' ? field.label : field.name;
    const label = [...prefix, fieldLabel].join(' › ');

    if (field.type === 'object' && field.list) {
      const bl = Array.isArray(b) ? b : [];
      const al = Array.isArray(a) ? a : [];
      const key = (item: unknown) =>
        item && typeof item === 'object' && typeof (item as any).id === 'string' ? (item as any).id : undefined;
      const matched = new Set<number>();
      bl.forEach((bItem, i) => {
        const k = key(bItem);
        let j = k !== undefined ? al.findIndex((x, idx) => !matched.has(idx) && key(x) === k) : -1;
        if (j < 0 && k === undefined && i < al.length && !matched.has(i)) j = i;
        if (j < 0) {
          out.push({ kind: 'removed', label: `${label} › ${itemLabel(field, bItem, i)}`, before: 'removed' });
          return;
        }
        matched.add(j);
        if (!deepEqual(bItem, al[j])) {
          if (i !== j) out.push({ kind: 'changed', label: `${label} › ${itemLabel(field, al[j], j)}`, before: `position ${i + 1}`, after: `position ${j + 1}` });
          diffFields(field.fields ?? [], bItem as any, al[j] as any, [...prefix, fieldLabel, itemLabel(field, al[j], j)], out);
        } else if (i !== j) {
          out.push({ kind: 'changed', label: `${label} › ${itemLabel(field, al[j], j)}`, before: `position ${i + 1}`, after: `position ${j + 1}` });
        }
      });
      al.forEach((aItem, j) => {
        if (!matched.has(j)) out.push({ kind: 'added', label: `${label} › ${itemLabel(field, aItem, j)}`, after: 'added' });
      });
    } else if (field.type === 'object') {
      diffFields(field.fields ?? [], b as any, a as any, [...prefix, fieldLabel], out);
    } else {
      const kind = b === undefined ? 'added' : a === undefined ? 'removed' : 'changed';
      out.push({ kind, label, before: fmt(b), after: fmt(a) });
    }
  }
}

/** Field-level change lines for a single document. */
export function diffDocument(collection: Collection, before: CmsDocument | undefined, after: CmsDocument): ChangeLine[] {
  const out: ChangeLine[] = [];
  diffFields(collection.fields as TinaField[], before?.values, after.values, [], out);
  return out;
}

export interface ChangeSummary {
  /** One entry per touched document. */
  documents: Array<{ collection: Collection; document: CmsDocument; action: 'updated' | 'created' | 'deleted'; lines: ChangeLine[] }>;
  /** Short list like ["Dough Announcement", "Daily Menu"] for titles. */
  collectionsTouched: string[];
}

export function summarizeChanges(
  collections: Collection[],
  originals: CmsDocument[],
  changes: ChangeSet,
): ChangeSummary {
  const byName = new Map(collections.map((c) => [c.name, c]));
  const find = (d: CmsDocument) => originals.find((o) => o.collection === d.collection && o.relativePath === d.relativePath);
  const documents: ChangeSummary['documents'] = [];
  for (const doc of changes.upserts) {
    const collection = byName.get(doc.collection)!;
    const before = find(doc);
    documents.push({ collection, document: doc, action: before ? 'updated' : 'created', lines: diffDocument(collection, before, doc) });
  }
  for (const doc of changes.deletes) {
    documents.push({ collection: byName.get(doc.collection)!, document: doc, action: 'deleted', lines: [] });
  }
  const collectionsTouched = [...new Set(documents.map((d) => collectionLabel(d.collection)))];
  return { documents, collectionsTouched };
}

/** Markdown body for the Pull Request description. */
export function changeSummaryMarkdown(summary: ChangeSummary, author: string, note?: string): string {
  const lines: string[] = [];
  lines.push(`## Content update from the Slow Dough staff editor`);
  lines.push('');
  lines.push(`Submitted by **@${author}**.`);
  lines.push('');
  if (note) {
    lines.push(`> ${note.replace(/[<>]/g, '').replace(/\n+/g, ' ')}`);
    lines.push('');
  }
  for (const d of summary.documents) {
    const title = docTitle(d.document);
    lines.push(`### ${collectionLabel(d.collection)}: ${title} (${d.action})`);
    lines.push('');
    lines.push(`\`${d.collection.path}/${d.document.relativePath}\``);
    lines.push('');
    if (d.lines.length) {
      for (const l of d.lines.slice(0, 60)) {
        if (l.kind === 'added' && l.after === 'added') lines.push(`- ➕ ${l.label}`);
        else if (l.kind === 'removed' && l.before === 'removed') lines.push(`- ➖ ${l.label}`);
        else lines.push(`- ✏️ ${l.label}: ${escapeMd(l.before ?? '(empty)')} → ${escapeMd(l.after ?? '(empty)')}`);
      }
      if (d.lines.length > 60) lines.push(`- … and ${d.lines.length - 60} more change(s)`);
      lines.push('');
    }
  }
  lines.push('---');
  lines.push('_Reviewer checklist: content reads correctly · prices/hours are right · no unexpected files changed. Merging to `main` deploys automatically to GitHub Pages._');
  return lines.join('\n');
}

export const collectionLabel = (c: Collection): string => (typeof c.label === 'string' ? c.label : c.name);

export function docTitle(doc: CmsDocument): string {
  const v = doc.values;
  for (const k of ['title', 'headline', 'name']) {
    if (typeof v[k] === 'string' && v[k]) return v[k] as string;
  }
  return doc.relativePath.replace(/\.json$/, '');
}

const escapeMd = (s: string) => s.replace(/[`*_<>]/g, (c) => `\\${c}`).replace(/\n/g, ' ');
