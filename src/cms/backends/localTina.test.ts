import { describe, expect, it, vi } from 'vitest';
import { announcementCollection, postCollection } from '../../../tina/schema';
import { LocalTinaBackend } from './localTina';

/** Minimal fake of Tina's local GraphQL server. */
function fakeTina(initial: Record<string, Record<string, Record<string, unknown>>>) {
  const store = JSON.parse(JSON.stringify(initial)) as typeof initial;
  const ops: string[] = [];
  const fetchImpl = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    const { query, variables = {} } = JSON.parse(String(init?.body)) as { query: string; variables?: any };
    const respond = (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 });
    if (query.includes('__typename }') && !query.includes('mutation') && !query.includes('document(')) return respond({ __typename: 'Query' });
    if (query.includes('collection(collection')) {
      const docs = store[variables.collection] ?? {};
      return respond({
        collection: {
          documents: {
            edges: Object.entries(docs).map(([relativePath, values]) => ({ node: { _sys: { relativePath }, _values: { _collection: variables.collection, _template: variables.collection, ...values } } })),
          },
        },
      });
    }
    if (query.includes('document(collection')) {
      const exists = !!store[variables.collection]?.[variables.relativePath];
      return respond({ document: exists ? { __typename: 'Doc' } : null });
    }
    if (query.includes('updateDocument')) {
      ops.push(`update ${variables.collection}/${variables.relativePath}`);
      store[variables.collection][variables.relativePath] = variables.params[variables.collection];
      return respond({ updateDocument: { __typename: 'Doc' } });
    }
    if (query.includes('createDocument')) {
      ops.push(`create ${variables.collection}/${variables.relativePath}`);
      (store[variables.collection] ??= {})[variables.relativePath] = variables.params[variables.collection];
      return respond({ createDocument: { __typename: 'Doc' } });
    }
    if (query.includes('deleteDocument')) {
      ops.push(`delete ${variables.collection}/${variables.relativePath}`);
      delete store[variables.collection][variables.relativePath];
      return respond({ deleteDocument: { __typename: 'Doc' } });
    }
    return new Response(JSON.stringify({ errors: [{ message: 'unknown op' }] }), { status: 200 });
  });
  return { fetchImpl: fetchImpl as unknown as typeof fetch, store, ops };
}

describe('LocalTinaBackend', () => {
  it('detects availability', async () => {
    const ok = fakeTina({});
    expect(await LocalTinaBackend.isAvailable('http://localhost:4001/graphql', ok.fetchImpl)).toBe(true);
    const down = (async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof fetch;
    expect(await LocalTinaBackend.isAvailable('http://localhost:4001/graphql', down)).toBe(false);
  });

  it('lists documents and strips Tina private keys', async () => {
    const t = fakeTina({ announcement: { 'announcement.json': { enabled: true, headline: 'Hi', detail: '' } } });
    const backend = new LocalTinaBackend('http://localhost:4001/graphql', t.fetchImpl);
    const docs = await backend.listDocuments(announcementCollection);
    expect(docs).toEqual([{ collection: 'announcement', relativePath: 'announcement.json', values: { enabled: true, headline: 'Hi', detail: '' } }]);
  });

  it('updates existing, creates new and deletes removed documents', async () => {
    const t = fakeTina({ post: { 'old.json': { title: 'Old' } } });
    const backend = new LocalTinaBackend('http://localhost:4001/graphql', t.fetchImpl);
    const result = await backend.submit(
      {
        upserts: [
          { collection: 'post', relativePath: 'old.json', values: { title: 'Old edited' } },
          { collection: 'post', relativePath: 'new.json', values: { title: 'New' } },
        ],
        deletes: [],
      },
      { title: 't', description: 'd' },
    );
    expect(result.kind).toBe('local-saved');
    expect(t.ops).toEqual(['update post/old.json', 'create post/new.json']);
    await backend.submit({ upserts: [], deletes: [{ collection: 'post', relativePath: 'new.json', values: {} }] }, { title: 't', description: 'd' });
    expect(t.ops.at(-1)).toBe('delete post/new.json');
    expect(Object.keys(t.store.post)).toEqual(['old.json']);
    expect(await backend.listDocuments(postCollection)).toHaveLength(1);
  });

  it('reports GraphQL errors and unreachable servers clearly', async () => {
    const erroring = (async () => new Response(JSON.stringify({ errors: [{ message: 'Boom' }] }), { status: 200 })) as unknown as typeof fetch;
    await expect(new LocalTinaBackend('u', erroring).listDocuments(postCollection)).rejects.toThrow('Boom');
    const down = (async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof fetch;
    await expect(new LocalTinaBackend('u', down).listDocuments(postCollection)).rejects.toThrow(/npm run dev/);
  });
});
