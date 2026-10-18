/**
 * Site content types. These mirror the Tina CMS schema in `tina/schema.ts`; the JSON files under
 * `content/` are the data, and `src/content/index.ts` loads them for the website.
 */

export interface Announcement {
  enabled: boolean;
  headline: string;
  detail?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  italianName?: string;
  description: string;
  price: number;
  tags?: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
}

export interface MenuCategory {
  id: string;
  title: string;
  subtitle?: string;
  items: MenuItem[];
}

export interface MenuContent {
  eyebrow?: string;
  title: string;
  intro?: string;
  categories: MenuCategory[];
}

export interface BlogSection {
  sectionHeading?: string;
  paragraphs: string[];
  quote?: string;
}

export interface BlogPost {
  /** Derived from the content filename (e.g. `importance-of-dough-aging`). */
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  author: string;
  authorRole?: string;
  readTime?: string;
  /** ISO-8601 date string as stored by Tina's `datetime` field. */
  publishedDate: string;
  artType: 'dough' | 'oven';
  draft?: boolean;
  excerpt: string;
  keyTakeaways: string[];
  content: BlogSection[];
}

export interface StoreHours {
  day: string;
  hours: string;
  statusNote?: string;
  isClosed?: boolean;
}

export interface HoursContent {
  schedule: StoreHours[];
}
