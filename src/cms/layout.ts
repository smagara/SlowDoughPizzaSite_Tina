/**
 * Editor layout hints: how a collection's fields are grouped into collapsible panels.
 *
 * Tina's schema describes *what* can be edited; this file describes how the staff editor lays it
 * out so the most-used fields are visible first and context-setting fields are folded into a
 * one-line summary. Fields not mentioned here are rendered in an always-open "Details" group, so
 * adding a field to the schema never hides it.
 */
export interface FieldGroup {
  id: string;
  label: string;
  /** Field names (top level of the document) shown in this group, in order. */
  fields: string[];
  /** Start collapsed. Groups containing validation errors open themselves regardless. */
  collapsed?: boolean;
  /** One-line summary shown while collapsed. */
  summary?: (values: Record<string, unknown>) => string;
}

const text = (v: unknown, fallback = '—') => (typeof v === 'string' && v.trim() ? v.trim() : fallback);
const date = (v: unknown) => {
  const t = typeof v === 'string' ? Date.parse(v) : NaN;
  return Number.isNaN(t) ? 'no date' : new Date(t).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
};
const count = (v: unknown, noun: string) => {
  const n = Array.isArray(v) ? v.length : 0;
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
};

export const fieldGroups: Record<string, FieldGroup[]> = {
  announcement: [{ id: 'banner', label: 'Banner', fields: ['enabled', 'headline', 'detail'] }],

  menu: [
    {
      id: 'heading',
      label: 'Section heading & intro',
      fields: ['eyebrow', 'title', 'intro'],
      collapsed: true,
      summary: (v) => `“${text(v.title)}” — ${text(v.eyebrow, 'no eyebrow')}`,
    },
    { id: 'categories', label: 'Menu categories & dishes', fields: ['categories'] },
  ],

  post: [
    { id: 'summary', label: 'Title & summary', fields: ['title', 'subtitle', 'excerpt', 'draft'] },
    {
      id: 'meta',
      label: 'Author, date & illustration',
      fields: ['author', 'authorRole', 'readTime', 'publishedDate', 'artType'],
      collapsed: true,
      summary: (v) =>
        `${text(v.author, 'no author')}${typeof v.authorRole === 'string' && v.authorRole ? ` (${v.authorRole})` : ''} · ${date(v.publishedDate)} · ${
          v.artType === 'oven' ? 'wood-fired oven illustration' : 'dough handling illustration'
        }${typeof v.readTime === 'string' && v.readTime ? ` · ${v.readTime}` : ''}`,
    },
    { id: 'takeaways', label: 'Key takeaways', fields: ['keyTakeaways'], collapsed: true, summary: (v) => count(v.keyTakeaways, 'takeaway') },
    { id: 'content', label: 'Essay sections', fields: ['content'] },
  ],

  hours: [{ id: 'schedule', label: 'Weekly schedule', fields: ['schedule'] }],
};

/** Resolve the groups for a collection, appending any schema fields the layout does not mention. */
export function groupsFor(collectionName: string, fieldNames: string[]): FieldGroup[] {
  const groups = (fieldGroups[collectionName] ?? []).map((g) => ({ ...g, fields: g.fields.filter((f) => fieldNames.includes(f)) })).filter((g) => g.fields.length > 0);
  const covered = new Set(groups.flatMap((g) => g.fields));
  const rest = fieldNames.filter((f) => !covered.has(f));
  if (rest.length) groups.push({ id: 'details', label: groups.length ? 'Other details' : 'Details', fields: rest });
  return groups;
}

/** Object-list items start collapsed unless the list is tiny; this keeps long menus short. */
export const LIST_ITEMS_OPEN_BY_DEFAULT_UP_TO = 1;
