import { describe, expect, it } from 'vitest';
import { announcementCollection, menuCollection, postCollection, hoursCollection } from '../../tina/schema';
import { errorsByPath, validateDocument } from './schemaValidation';

const goodMenu = {
  eyebrow: 'Seasonal',
  title: 'Our Daily Menu',
  intro: 'Intro',
  categories: [
    {
      id: 'pies',
      title: 'Pies',
      subtitle: '',
      items: [{ id: 'margherita', name: 'Margherita', italianName: '', description: 'Tomato & basil', price: 19, tags: ['Vegetarian'], isVegetarian: true, isVegan: false }],
    },
  ],
};

describe('validateDocument', () => {
  it('accepts a valid announcement', () => {
    expect(validateDocument(announcementCollection, { enabled: true, headline: 'Hi', detail: '' })).toEqual([]);
  });

  it('reports required fields and script content with paths', () => {
    const errors = validateDocument(announcementCollection, { enabled: 'yes', headline: '<script>x</script>', detail: 'javascript:alert(1)' });
    const byPath = errorsByPath(errors);
    expect(byPath.enabled).toBe('Expected true or false.');
    expect(byPath.headline).toMatch(/Angle brackets/);
    expect(byPath.detail).toMatch(/javascript:/);
  });

  it('rejects unknown fields and non-object documents', () => {
    expect(validateDocument(announcementCollection, { enabled: true, headline: 'x', extra: 1 })).toEqual([{ path: 'extra', message: 'Unknown field "extra".' }]);
    expect(validateDocument(announcementCollection, null)).toEqual([{ path: '', message: 'Document must be a JSON object.' }]);
    expect(validateDocument(announcementCollection, [])).toHaveLength(1);
  });

  it('walks nested object lists and reports precise paths', () => {
    const bad = JSON.parse(JSON.stringify(goodMenu));
    bad.categories[0].items[0].price = -5;
    bad.categories[0].items[0].description = 'Nice <b>pizza</b>';
    bad.categories[0].items.push({ ...bad.categories[0].items[0], id: 'margherita', price: 20, description: 'dup id' });
    const byPath = errorsByPath(validateDocument(menuCollection, bad));
    expect(byPath['categories[0].items[0].price']).toMatch(/negative/);
    expect(byPath['categories[0].items[0].description']).toMatch(/Angle brackets/);
    expect(byPath['categories[0].items']).toMatch(/Duplicate item ID "margherita"/);
  });

  it('accepts the good menu and enforces category rules', () => {
    expect(validateDocument(menuCollection, goodMenu)).toEqual([]);
    const noCats = { ...goodMenu, categories: [] };
    expect(errorsByPath(validateDocument(menuCollection, noCats)).categories).toMatch(/at least one/);
    const dupCats = { ...goodMenu, categories: [goodMenu.categories[0], goodMenu.categories[0]] };
    expect(errorsByPath(validateDocument(menuCollection, dupCats)).categories).toMatch(/Duplicate category ID/);
  });

  it('validates posts: select options, dates, paragraphs', () => {
    const post = {
      title: 'T',
      subtitle: '',
      author: 'A',
      authorRole: '',
      readTime: '4 min read',
      publishedDate: 'yesterday',
      artType: 'pasta',
      draft: false,
      excerpt: 'E',
      keyTakeaways: [],
      content: [{ sectionHeading: '', paragraphs: [] as string[], quote: '' }],
    };
    const byPath = errorsByPath(validateDocument(postCollection, post));
    expect(byPath.publishedDate).toMatch(/valid date/);
    expect(byPath.artType).toMatch(/Must be one of: dough, oven/);
    expect(byPath['content[0].paragraphs']).toMatch(/at least 1/);
    post.publishedDate = '2026-01-01T00:00:00.000Z';
    post.artType = 'oven';
    post.content[0].paragraphs = ['Hello\n\nworld'];
    expect(validateDocument(postCollection, post)).toEqual([]);
  });

  it('requires exactly seven days of hours', () => {
    const six = { schedule: Array.from({ length: 6 }, (_, i) => ({ day: `D${i}`, hours: 'Closed', statusNote: '', isClosed: true })) };
    expect(errorsByPath(validateDocument(hoursCollection, six)).schedule).toMatch(/exactly 7/);
  });
});
