import type { Collection } from 'tinacms';
import type { ChangeSet, CmsDocument, SubmitMeta, SubmitResult } from '../documents';

/**
 * A content backend is where the staff editor reads documents from and writes changes to.
 *
 *  - `LocalTinaBackend`  → Tina's local GraphQL server (`tinacms dev`), writes straight to disk.
 *  - `GitHubBackend`     → GitHub REST API; writes become a feature branch + Pull Request.
 */
export interface ContentBackend {
  readonly kind: 'local' | 'github';
  /** Short label shown in the editor header. */
  readonly label: string;
  /** Load every document of a collection. */
  listDocuments(collection: Collection): Promise<CmsDocument[]>;
  /** Persist a set of changes. */
  submit(changes: ChangeSet, meta: SubmitMeta): Promise<SubmitResult>;
}

export class CmsError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'unauthenticated'
      | 'forbidden'
      | 'not-found'
      | 'conflict'
      | 'rate-limited'
      | 'network'
      | 'validation'
      | 'unknown' = 'unknown',
  ) {
    super(message);
    this.name = 'CmsError';
  }
}
