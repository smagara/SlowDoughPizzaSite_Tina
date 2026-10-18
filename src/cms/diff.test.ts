import { describe, expect, it } from 'vitest';
import { announcementCollection, collections, menuCollection } from '../../tina/schema';
import { changeSummaryMarkdown, diffDocument, summarizeChanges } from './diff';
import type { CmsDocument } from './documents';

const doc = (collection: string, relativePath: string, values: Record<string, unknown>): CmsDocument => ({ collection, relativePath, values });

describe('diffDocument', () => {
  it('lists scalar changes with labels', () => {
    const before = doc('announcement', 'announcement.json', { enabled: true, headline: 'Old', detail: 'x' });
    const after = doc('announcement', 'announcement.json', { enabled: false, headline: 'New', detail: 'x' });
    const lines = diffDocument(announcementCollection, before, after);
    expect(lines).toEqual([
      { kind: 'changed', label: 'Show the announcement banner', before: 'true', after: 'false' },
      { kind: 'changed', label: 'Headline', before: 'Old', after: 'New' },
    ]);
  });

  it('matches list items by id and reports added/removed/changed', () => {
    const base = {
      title: 'Menu',
      categories: [
        {
          id: 'pies',
          title: 'Pies',
          items: [
            { id: 'a', name: 'A', description: 'd', price: 10 },
            { id: 'b', name: 'B', description: 'd', price: 12 },
          ],
        },
      ],
    };
    const next = JSON.parse(JSON.stringify(base));
    next.categories[0].items[0].price = 11; // changed
    next.categories[0].items.splice(1, 1); // removed b
    next.categories[0].items.push({ id: 'c', name: 'C', description: 'd', price: 9 }); // added c
    const lines = diffDocument(menuCollection, doc('menu', 'menu.json', base), doc('menu', 'menu.json', next));
    expect(lines).toContainEqual({ kind: 'changed', label: 'Menu categories › Pies › Items › A — $11 › Price (USD)', before: '10', after: '11' });
    expect(lines.some((l) => l.kind === 'removed' && l.label.includes('B — $12'))).toBe(true);
    expect(lines.some((l) => l.kind === 'added' && l.label.includes('C — $9'))).toBe(true);
  });
});

describe('summarizeChanges / markdown', () => {
  it('builds a PR body with actions, file paths and sanitised notes', () => {
    const originals = [doc('announcement', 'announcement.json', { enabled: true, headline: 'Old', detail: '' })];
    const changes = {
      upserts: [doc('announcement', 'announcement.json', { enabled: true, headline: 'New', detail: '' }), doc('post', 'new-post.json', { title: 'Fresh', author: 'Me' })],
      deletes: [doc('post', 'old.json', { title: 'Old post' })],
    };
    const summary = summarizeChanges(collections, originals, changes);
    expect(summary.collectionsTouched).toEqual(['Dough Announcement', 'Blog Posts']);
    expect(summary.documents.map((d) => d.action)).toEqual(['updated', 'created', 'deleted']);
    const md = changeSummaryMarkdown(summary, 'pizza-staff', 'please <script>review</script>');
    expect(md).toContain('Submitted by **@pizza-staff**.');
    expect(md).toContain('> please scriptreview/script');
    expect(md).not.toContain('<script>');
    expect(md).toContain('`content/settings/announcement.json`');
    expect(md).toContain('Headline: Old → New');
    expect(md).toContain('### Blog Posts: Fresh (created)');
    expect(md).toContain('### Blog Posts: Old post (deleted)');
    expect(md).toContain('Reviewer checklist');
  });
});
