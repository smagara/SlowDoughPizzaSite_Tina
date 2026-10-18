/**
 * Tina CMS content model for Slow Dough Pizza Co.
 *
 * This file is the single source of truth for what staff can edit. It is consumed by:
 *   - `tina/config.ts`            → the stock Tina admin (local "tinacms dev" mode, or TinaCloud)
 *   - `src/cms/EditorApp`         → the site-styled staff editor that opens GitHub Pull Requests
 *   - `src/cms/schemaValidation`  → CI validation of every file under `content/`
 *
 * IMPORTANT: only *types* are imported from `tinacms` here so that the public website bundle never
 * has to ship the (large) Tina runtime.
 */
import type { Collection, TinaField } from 'tinacms';
import {
  LIMITS,
  validateDate,
  validatePrice,
  validateSlug,
  validateText,
  validateTextList,
} from '../src/cms/validation';

// ---------------------------------------------------------------------------------------------
// Field helpers – small factories so validation rules are applied consistently.
// ---------------------------------------------------------------------------------------------
const text = (
  name: string,
  label: string,
  opts: { required?: boolean; max?: number; description?: string } = {},
): TinaField => ({
  type: 'string',
  name,
  label,
  required: opts.required,
  description: opts.description,
  ui: {
    validate: (value) => validateText(value, { required: opts.required, max: opts.max ?? LIMITS.short }),
  },
});

const textarea = (
  name: string,
  label: string,
  opts: { required?: boolean; max?: number; description?: string } = {},
): TinaField => ({
  type: 'string',
  name,
  label,
  required: opts.required,
  description: opts.description,
  ui: {
    component: 'textarea',
    validate: (value) =>
      validateText(value, { required: opts.required, max: opts.max ?? LIMITS.long, multiline: true }),
  },
});

const textList = (
  name: string,
  label: string,
  opts: { max?: number; maxItems?: number; minItems?: number; description?: string } = {},
): TinaField => ({
  type: 'string',
  name,
  label,
  list: true,
  description: opts.description,
  ui: {
    validate: (value) =>
      validateTextList(value, {
        max: opts.max ?? LIMITS.long,
        maxItems: opts.maxItems,
        minItems: opts.minItems,
        multiline: false,
      }),
  },
});

/**
 * Tina types object-list `ui.validate` callbacks loosely; this helper gives us a typed array and
 * keeps the call sites readable.
 */
const listValidator =
  <T>(fn: (items: T[]) => string | undefined) =>
  (value: unknown): string | undefined =>
    fn(Array.isArray(value) ? (value as T[]) : []);

const slug = (name: string, label: string, description?: string): TinaField => ({
  type: 'string',
  name,
  label,
  required: true,
  description: description ?? 'Lowercase letters, numbers and hyphens only. Used internally – keep it stable.',
  ui: { validate: (value) => validateSlug(value) },
});

// ---------------------------------------------------------------------------------------------
// 1. Dough announcement – the dark banner at the very top of every page.
// ---------------------------------------------------------------------------------------------
export const announcementCollection: Collection = {
  name: 'announcement',
  label: 'Dough Announcement',
  path: 'content/settings',
  format: 'json',
  match: { include: 'announcement' },
  ui: {
    allowedActions: { create: false, delete: false },
    global: true,
  },
  fields: [
    {
      type: 'boolean',
      name: 'enabled',
      label: 'Show the announcement banner',
      description: 'Turn the banner off entirely (for example, while closed for holidays).',
    },
    text('headline', 'Headline', {
      required: true,
      max: LIMITS.short,
      description: 'Shown on every screen size, e.g. "Today\'s Dough: 72-Hour Cold Cellar Ferment".',
    }),
    text('detail', 'Detail (desktop only)', {
      max: LIMITS.medium,
      description: 'Secondary note shown on larger screens, e.g. "Doors open at 4:30 PM (Wed–Sun)".',
    }),
  ],
};

// ---------------------------------------------------------------------------------------------
// 2. Daily menu – categories → items.
// ---------------------------------------------------------------------------------------------
export const menuItemFields: TinaField[] = [
  slug('id', 'Item ID'),
  text('name', 'Name', { required: true, max: LIMITS.short }),
  text('italianName', 'Italian name', { max: LIMITS.short }),
  textarea('description', 'Description', { required: true, max: LIMITS.long }),
  {
    type: 'number',
    name: 'price',
    label: 'Price (USD)',
    required: true,
    ui: { validate: (value: unknown) => validatePrice(value) },
  },
  textList('tags', 'Tags', {
    max: 30,
    maxItems: 6,
    description: 'Small badges such as "Vegetarian", "Spicy", "House Favorite".',
  }),
  { type: 'boolean', name: 'isVegetarian', label: 'Vegetarian' },
  { type: 'boolean', name: 'isVegan', label: 'Vegan' },
];

export const menuCollection: Collection = {
  name: 'menu',
  label: 'Daily Menu',
  path: 'content/menu',
  format: 'json',
  match: { include: 'menu' },
  ui: {
    allowedActions: { create: false, delete: false },
    global: true,
  },
  fields: [
    text('eyebrow', 'Eyebrow label', { max: LIMITS.short, description: 'Small caps text above the heading.' }),
    text('title', 'Section heading', { required: true, max: LIMITS.short }),
    textarea('intro', 'Introduction', { max: LIMITS.long }),
    {
      type: 'object',
      name: 'categories',
      label: 'Menu categories',
      list: true,
      ui: {
        itemProps: (item) => ({ label: item?.title || 'New category' }),
        defaultItem: { id: 'new-category', title: 'New Category', subtitle: '', items: [] },
        validate: listValidator<{ id?: string }>((value) => {
          if (value.length === 0) return 'Add at least one menu category.';
          if (value.length > 12) return 'Please keep the menu to 12 categories or fewer.';
          const ids = new Set<string>();
          for (const cat of value) {
            if (cat?.id && ids.has(cat.id)) return `Duplicate category ID "${cat.id}".`;
            if (cat?.id) ids.add(cat.id);
          }
          return undefined;
        }),
      },
      fields: [
        slug('id', 'Category ID'),
        text('title', 'Title', { required: true, max: LIMITS.short }),
        textarea('subtitle', 'Subtitle', { max: LIMITS.medium }),
        {
          type: 'object',
          name: 'items',
          label: 'Items',
          list: true,
          ui: {
            itemProps: (item) => ({
              label: item?.name ? `${item.name}${item.price != null ? ` — $${item.price}` : ''}` : 'New item',
            }),
            defaultItem: {
              id: 'new-item',
              name: 'New Item',
              italianName: '',
              description: '',
              price: 0,
              tags: [],
              isVegetarian: false,
              isVegan: false,
            },
            validate: listValidator<{ id?: string }>((value) => {
              if (value.length > 40) return 'Please keep each category to 40 items or fewer.';
              const ids = new Set<string>();
              for (const item of value) {
                if (item?.id && ids.has(item.id)) return `Duplicate item ID "${item.id}".`;
                if (item?.id) ids.add(item.id);
              }
              return undefined;
            }),
          },
          fields: menuItemFields,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------------------------
// 3. Blog posts ("The Baker's Journal") – one JSON document per post.
// ---------------------------------------------------------------------------------------------
export const postCollection: Collection = {
  name: 'post',
  label: 'Blog Posts',
  path: 'content/posts',
  format: 'json',
  ui: {
    filename: {
      readonly: false,
      slugify: (values) =>
        String(values?.title ?? 'untitled')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 64),
    },
  },
  defaultItem: () => ({
    title: 'New Essay',
    subtitle: '',
    author: '',
    authorRole: '',
    readTime: '3 min read',
    publishedDate: new Date().toISOString(),
    artType: 'dough',
    draft: true,
    excerpt: '',
    keyTakeaways: [],
    content: [{ sectionHeading: '', paragraphs: [''], quote: '' }],
  }),
  fields: [
    text('title', 'Title', { required: true, max: LIMITS.medium }),
    text('subtitle', 'Subtitle', { max: LIMITS.medium }),
    text('author', 'Author', { required: true, max: LIMITS.short }),
    text('authorRole', 'Author role', { max: LIMITS.short }),
    text('readTime', 'Read time', { max: 20, description: 'e.g. "4 min read"' }),
    {
      type: 'datetime',
      name: 'publishedDate',
      label: 'Published date',
      required: true,
      ui: { dateFormat: 'MMMM DD, YYYY', validate: (value) => validateDate(value) },
    },
    {
      type: 'string',
      name: 'artType',
      label: 'Illustration',
      required: true,
      options: [
        { value: 'dough', label: 'Dough handling (Fig. 01)' },
        { value: 'oven', label: 'Wood-fired oven (Fig. 02)' },
      ],
    },
    {
      type: 'boolean',
      name: 'draft',
      label: 'Draft (hide from the website)',
      description: 'Drafts stay in the repository but are not shown to visitors.',
    },
    textarea('excerpt', 'Excerpt', { required: true, max: LIMITS.long }),
    textList('keyTakeaways', 'Key takeaways', { max: LIMITS.long, maxItems: 6 }),
    {
      type: 'object',
      name: 'content',
      label: 'Essay sections',
      list: true,
      ui: {
        itemProps: (item) => ({ label: item?.sectionHeading || 'Untitled section' }),
        defaultItem: { sectionHeading: '', paragraphs: [''], quote: '' },
        validate: listValidator((value) => {
          if (value.length === 0) return 'Add at least one section.';
          if (value.length > 12) return 'Please keep essays to 12 sections or fewer.';
          return undefined;
        }),
      },
      fields: [
        text('sectionHeading', 'Section heading', { max: LIMITS.medium }),
        {
          type: 'string',
          name: 'paragraphs',
          label: 'Paragraphs',
          list: true,
          ui: {
            component: 'textarea',
            validate: (value) =>
              validateTextList(value, { max: LIMITS.paragraph, maxItems: 20, minItems: 1, multiline: true }),
          },
        },
        textarea('quote', 'Pull quote', { max: LIMITS.medium }),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------------------------
// 4. Store hours – included because it is the other "routine" update staff make.
// ---------------------------------------------------------------------------------------------
export const hoursCollection: Collection = {
  name: 'hours',
  label: 'Store Hours',
  path: 'content/hours',
  format: 'json',
  match: { include: 'hours' },
  ui: {
    allowedActions: { create: false, delete: false },
    global: true,
  },
  fields: [
    {
      type: 'object',
      name: 'schedule',
      label: 'Weekly schedule',
      list: true,
      ui: {
        itemProps: (item) => ({ label: `${item?.day ?? 'Day'} — ${item?.hours ?? ''}` }),
        validate: listValidator((value) => {
          if (value.length !== 7) return 'The schedule must have exactly 7 days.';
          return undefined;
        }),
      },
      fields: [
        text('day', 'Day', { required: true, max: 12 }),
        text('hours', 'Hours', { required: true, max: 40, description: 'e.g. "4:30 PM – 9:30 PM" or "Closed"' }),
        text('statusNote', 'Status note', { max: LIMITS.short }),
        { type: 'boolean', name: 'isClosed', label: 'Closed this day' },
      ],
    },
  ],
};

/** Ordered list of everything staff can edit. */
export const collections: Collection[] = [announcementCollection, menuCollection, postCollection, hoursCollection];

export const SITE_CONTENT_DIR = 'content';
