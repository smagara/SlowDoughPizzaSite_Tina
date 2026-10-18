import { describe, expect, it } from 'vitest';
import { announcementCollection, menuCollection } from '../../tina/schema';
import { deepClone, deepEqual, orderBySchema, serializeDocument } from './serialize';

describe('serialize', () => {
  it('orders keys by schema and keeps unknown keys last', () => {
    const out = orderBySchema({ detail: 'd', zzz: 1, headline: 'h', enabled: true }, announcementCollection.fields as any);
    expect(Object.keys(out)).toEqual(['enabled', 'headline', 'detail', 'zzz']);
  });

  it('orders nested list items too and ends with a newline', () => {
    const text = serializeDocument(
      { categories: [{ items: [{ price: 1, id: 'a', name: 'A', description: 'x' }], title: 'Cat', id: 'cat' }], title: 'Menu' },
      menuCollection,
    );
    const parsed = JSON.parse(text);
    expect(Object.keys(parsed)).toEqual(['title', 'categories']);
    expect(Object.keys(parsed.categories[0])).toEqual(['id', 'title', 'items']);
    expect(Object.keys(parsed.categories[0].items[0])).toEqual(['id', 'name', 'description', 'price']);
    expect(text.endsWith('\n')).toBe(true);
    expect(text).toContain('\n  "title"'); // 2-space indent
  });

  it('deepEqual / deepClone behave structurally', () => {
    expect(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
    expect(deepEqual(null, undefined)).toBe(false);
    const src = { a: { b: [1] } };
    const copy = deepClone(src);
    copy.a.b.push(2);
    expect(src.a.b).toEqual([1]);
  });
});
