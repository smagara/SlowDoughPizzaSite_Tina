/**
 * Content loader for the public website.
 *
 * The website is a static site (GitHub Pages), so content is bundled at build time straight from the
 * JSON files that Tina CMS manages under `content/`. In development Vite hot-reloads these modules,
 * so saving in the Tina admin (or the staff editor in local mode) updates the site immediately.
 */
import type { Announcement, BlogPost, HoursContent, MenuContent } from '../types';
import announcementJson from '../../content/settings/announcement.json';
import menuJson from '../../content/menu/menu.json';
import hoursJson from '../../content/hours/hours.json';

type RawPost = Omit<BlogPost, 'id' | 'slug'>;

const postModules = import.meta.glob<RawPost>('../../content/posts/*.json', {
  eager: true,
  import: 'default',
});

export function getAnnouncement(): Announcement {
  return announcementJson as Announcement;
}

export function getMenu(): MenuContent {
  return menuJson as MenuContent;
}

export function getHours(): HoursContent {
  return hoursJson as HoursContent;
}

/** All posts (including drafts), newest first. */
export function getAllPosts(): BlogPost[] {
  return Object.entries(postModules)
    .map(([path, raw]) => {
      const slug = path.split('/').pop()!.replace(/\.json$/, '');
      return { ...raw, id: slug, slug } satisfies BlogPost;
    })
    .sort((a, b) => Date.parse(b.publishedDate) - Date.parse(a.publishedDate));
}

/** Published posts only – what visitors see. */
export function getPublishedPosts(): BlogPost[] {
  return getAllPosts().filter((p) => !p.draft);
}

/** "September 14, 2026" style formatting for ISO dates. */
export function formatPublishedDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(t));
}
