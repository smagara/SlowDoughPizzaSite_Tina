import type { Collection } from 'tinacms';
import { cmsConfig } from '../config';
import { stripPrivateKeys, type ChangeSet, type CmsDocument, type SubmitMeta, type SubmitResult } from '../documents';
import { CmsError, type ContentBackend } from './types';

type Fetch = typeof fetch;

/**
 * Local edit mode: talks to the GraphQL API that `tinacms dev` starts on http://localhost:4001.
 * Tina writes the JSON files directly, Vite hot-reloads the site – no git, no GitHub, no auth.
 */
export class LocalTinaBackend implements ContentBackend {
  readonly kind = 'local' as const;
  readonly label = 'Local edit mode (Tina dev server)';

  constructor(
    private readonly url: string = cmsConfig.tinaLocalUrl,
    private readonly fetchImpl: Fetch = (...args) => fetch(...args),
  ) {}

  /** Quick probe used to decide whether local mode is available. */
  static async isAvailable(url: string = cmsConfig.tinaLocalUrl, fetchImpl: Fetch = fetch, timeoutMs = 1500): Promise<boolean> {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const timer = setTimeout(() => controller?.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' }),
        signal: controller?.signal,
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  private async gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    let res: Response;
    try {
      res = await this.fetchImpl(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
    } catch (e) {
      throw new CmsError(`Could not reach the local Tina server at ${this.url}. Is "npm run dev" running?`, 'network');
    }
    if (!res.ok) throw new CmsError(`Local Tina server error (${res.status}).`, 'unknown');
    const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
    if (json.errors?.length) throw new CmsError(json.errors.map((e) => e.message).join('; '), 'validation');
    return json.data as T;
  }

  async listDocuments(collection: Collection): Promise<CmsDocument[]> {
    const data = await this.gql<{
      collection: { documents: { edges: Array<{ node: { _sys: { relativePath: string }; _values: Record<string, unknown> } }> } };
    }>(
      `query List($collection: String!) {
        collection(collection: $collection) {
          documents(first: 200) { edges { node { ... on Document { _sys { relativePath } _values } } } }
        }
      }`,
      { collection: collection.name },
    );
    return data.collection.documents.edges.map(({ node }) => ({
      collection: collection.name,
      relativePath: node._sys.relativePath,
      values: stripPrivateKeys(node._values),
    }));
  }

  async submit(changes: ChangeSet, _meta: SubmitMeta): Promise<SubmitResult> {
    const files: string[] = [];
    for (const doc of changes.upserts) {
      const exists = await this.exists(doc);
      if (exists) {
        await this.gql(
          `mutation Update($collection: String!, $relativePath: String!, $params: DocumentUpdateMutation!) {
            updateDocument(collection: $collection, relativePath: $relativePath, params: $params) { __typename }
          }`,
          { collection: doc.collection, relativePath: doc.relativePath, params: { [doc.collection]: doc.values } },
        );
      } else {
        await this.gql(
          `mutation Create($collection: String!, $relativePath: String!, $params: DocumentMutation!) {
            createDocument(collection: $collection, relativePath: $relativePath, params: $params) { __typename }
          }`,
          { collection: doc.collection, relativePath: doc.relativePath, params: { [doc.collection]: doc.values } },
        );
      }
      files.push(`${doc.collection}/${doc.relativePath}`);
    }
    for (const doc of changes.deletes) {
      await this.gql(
        `mutation Delete($collection: String!, $relativePath: String!) {
          deleteDocument(collection: $collection, relativePath: $relativePath) { __typename }
        }`,
        { collection: doc.collection, relativePath: doc.relativePath },
      );
      files.push(`${doc.collection}/${doc.relativePath} (deleted)`);
    }
    return { kind: 'local-saved', files };
  }

  private async exists(doc: CmsDocument): Promise<boolean> {
    try {
      const data = await this.gql<{ document: { __typename: string } | null }>(
        `query Exists($collection: String!, $relativePath: String!) {
          document(collection: $collection, relativePath: $relativePath) { __typename }
        }`,
        { collection: doc.collection, relativePath: doc.relativePath },
      );
      return !!data.document;
    } catch {
      return false;
    }
  }
}
