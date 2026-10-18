/**
 * Every content file in the repository must satisfy the Tina schema and the validation rules.
 * This is the test CI runs on each Pull Request (`npm run validate:content`), so a hand-edited or
 * malicious PR that injects markup into the content files fails before it can be merged.
 */
import { describe, expect, it } from 'vitest';
import { collections } from '../../tina/schema';
import { validateDocument } from './schemaValidation';

const files = import.meta.glob<Record<string, unknown>>('../../content/**/*.json', { eager: true, import: 'default' });

describe('content files', () => {
  it('exist for every collection', () => {
    for (const c of collections) {
      const matching = Object.keys(files).filter((p) => p.includes(`/${c.path}/`));
      expect(matching.length, `no files for collection ${c.name}`).toBeGreaterThan(0);
    }
  });

  for (const [path, values] of Object.entries(files)) {
    it(`${path.replace('../../', '')} is valid`, () => {
      const collection = collections.find((c) => path.includes(`/${c.path}/`));
      expect(collection, `no collection matches ${path}`).toBeDefined();
      const errors = validateDocument(collection!, values);
      expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
    });
  }

  it('singleton collections have exactly one file', () => {
    for (const c of collections.filter((c) => c.ui?.allowedActions?.create === false)) {
      const matching = Object.keys(files).filter((p) => p.includes(`/${c.path}/`));
      expect(matching, c.name).toHaveLength(1);
    }
  });
});
