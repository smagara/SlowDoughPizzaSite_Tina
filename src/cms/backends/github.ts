import type { Collection } from 'tinacms';
import { GITHUB_API, cmsConfig, type CmsConfig } from '../config';
import { documentPath, type ChangeSet, type CmsDocument, type SubmitMeta, type SubmitResult } from '../documents';
import { serializeDocument } from '../serialize';
import { collections as schemaCollections } from '../../../tina/schema';
import { CmsError, type ContentBackend } from './types';

type Fetch = typeof fetch;

export interface GitHubUser {
  login: string;
  name?: string | null;
  avatarUrl?: string;
  /** Effective permission on the content repository. */
  permission: 'admin' | 'maintain' | 'write';
}

const ALLOWED_PERMISSIONS = new Set(['admin', 'maintain', 'write']);

/** Minimal GitHub REST client with friendly error mapping. */
export class GitHubClient {
  constructor(
    private readonly token: string,
    private readonly fetchImpl: Fetch = (...args) => fetch(...args),
    private readonly apiBase: string = GITHUB_API,
  ) {}

  async request<T>(path: string, init: RequestInit & { raw?: boolean } = {}): Promise<T> {
    const { raw, ...rest } = init;
    const headers: Record<string, string> = {
      Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
      Authorization: `Bearer ${this.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(rest.headers as Record<string, string> | undefined),
    };
    if (rest.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

    let res: Response;
    try {
      res = await this.fetchImpl(`${this.apiBase}${path}`, { ...rest, headers });
    } catch {
      throw new CmsError('Could not reach GitHub. Check your internet connection and try again.', 'network');
    }

    if (!res.ok) {
      let detail = '';
      try {
        const body = (await res.json()) as { message?: string };
        detail = body?.message ? ` (${body.message})` : '';
      } catch {
        /* ignore */
      }
      if (res.status === 401) throw new CmsError('GitHub rejected the access token. It may be invalid or expired.', 'unauthenticated');
      if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') {
        throw new CmsError('GitHub API rate limit reached. Please wait a few minutes and try again.', 'rate-limited');
      }
      if (res.status === 403) throw new CmsError(`GitHub denied this action${detail}.`, 'forbidden');
      if (res.status === 404) throw new CmsError(`Not found on GitHub${detail}. Does the token have access to this repository?`, 'not-found');
      if (res.status === 409) throw new CmsError(`GitHub reported a conflict${detail}.`, 'conflict');
      if (res.status === 422) throw new CmsError(`GitHub could not process the request${detail}.`, 'validation');
      throw new CmsError(`GitHub error ${res.status}${detail}.`, 'unknown');
    }
    if (res.status === 204) return undefined as T;
    return (raw ? await res.text() : await res.json()) as T;
  }
}

/**
 * Production mode: every save becomes a commit on a fresh `cms/…` branch plus a Pull Request
 * against `main`. Nothing is ever written to `main` directly – merging the PR (after review)
 * triggers the GitHub Pages deploy workflow.
 */
export class GitHubBackend implements ContentBackend {
  readonly kind = 'github' as const;
  readonly label: string;

  constructor(
    private readonly client: GitHubClient,
    private readonly user: GitHubUser,
    private readonly cfg: CmsConfig = cmsConfig,
    private readonly now: () => Date = () => new Date(),
    private readonly collections: Collection[] = schemaCollections,
  ) {
    this.label = `GitHub review mode (${cfg.owner}/${cfg.repo})`;
  }

  private get repo() {
    return `/repos/${this.cfg.owner}/${this.cfg.repo}`;
  }

  /**
   * Authenticate a token and confirm the user is a collaborator with write access.
   * Throws `CmsError('forbidden')` for anyone else – GitHub itself would also refuse to let them
   * create branches or PRs, so this is a UX check layered on top of GitHub's own enforcement.
   */
  static async verifyAccess(client: GitHubClient, cfg: CmsConfig = cmsConfig): Promise<GitHubUser> {
    const me = await client.request<{ login: string; name?: string | null; avatar_url?: string }>('/user');

    let permission: string | undefined;
    try {
      const perm = await client.request<{ permission: string; role_name?: string }>(
        `/repos/${cfg.owner}/${cfg.repo}/collaborators/${encodeURIComponent(me.login)}/permission`,
      );
      permission = perm.role_name && ALLOWED_PERMISSIONS.has(perm.role_name) ? perm.role_name : perm.permission;
    } catch (e) {
      // Non-collaborators get 403/404 here. Fall back to the repo's permission summary, which is
      // present for any token that can at least see the repository.
      if (e instanceof CmsError && (e.code === 'forbidden' || e.code === 'not-found')) {
        const repo = await client.request<{ permissions?: { admin?: boolean; maintain?: boolean; push?: boolean } }>(
          `/repos/${cfg.owner}/${cfg.repo}`,
        );
        permission = repo.permissions?.admin ? 'admin' : repo.permissions?.maintain ? 'maintain' : repo.permissions?.push ? 'write' : 'read';
      } else {
        throw e;
      }
    }

    if (!permission || !ALLOWED_PERMISSIONS.has(permission)) {
      throw new CmsError(
        `@${me.login} is not a collaborator with write access to ${cfg.owner}/${cfg.repo}. Ask the site owner to add you as a collaborator.`,
        'forbidden',
      );
    }
    return { login: me.login, name: me.name, avatarUrl: me.avatar_url, permission: permission as GitHubUser['permission'] };
  }

  async listDocuments(collection: Collection): Promise<CmsDocument[]> {
    const dir = collection.path.replace(/\/+$/, '');
    const entries = await this.client.request<Array<{ name: string; path: string; sha: string; type: string }>>(
      `${this.repo}/contents/${dir}?ref=${encodeURIComponent(this.cfg.baseBranch)}`,
    );
    const files = (Array.isArray(entries) ? entries : []).filter((e) => e.type === 'file' && e.name.endsWith('.json'));
    const docs = await Promise.all(
      files.map(async (f) => {
        const text = await this.client.request<string>(
          `${this.repo}/contents/${f.path}?ref=${encodeURIComponent(this.cfg.baseBranch)}`,
          { raw: true },
        );
        let values: Record<string, unknown>;
        try {
          values = JSON.parse(text) as Record<string, unknown>;
        } catch {
          throw new CmsError(`The file ${f.path} on ${this.cfg.baseBranch} is not valid JSON.`, 'validation');
        }
        return { collection: collection.name, relativePath: f.name, values, sha: f.sha } satisfies CmsDocument;
      }),
    );
    return docs.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  async submit(changes: ChangeSet, meta: SubmitMeta): Promise<SubmitResult> {
    if (changes.upserts.length + changes.deletes.length === 0) {
      throw new CmsError('There are no changes to submit.', 'validation');
    }
    const byName = new Map(this.collections.map((c) => [c.name, c]));
    const pathOf = (d: CmsDocument) => {
      const c = byName.get(d.collection);
      if (!c) throw new CmsError(`Unknown collection "${d.collection}".`, 'validation');
      return documentPath(c, d.relativePath);
    };

    // 1. Where is `main` right now?
    const ref = await this.client.request<{ object: { sha: string } }>(`${this.repo}/git/ref/heads/${this.cfg.baseBranch}`);
    const baseCommitSha = ref.object.sha;
    const baseCommit = await this.client.request<{ tree: { sha: string } }>(`${this.repo}/git/commits/${baseCommitSha}`);

    // 2. Conflict detection – refuse to overwrite files that changed on main since they were loaded.
    const tree = await this.client.request<{ tree: Array<{ path: string; sha: string; type: string }> }>(
      `${this.repo}/git/trees/${baseCommit.tree.sha}?recursive=1`,
    );
    const shaByPath = new Map(tree.tree.filter((t) => t.type === 'blob').map((t) => [t.path, t.sha]));
    for (const doc of [...changes.upserts, ...changes.deletes]) {
      const p = pathOf(doc);
      const current = shaByPath.get(p);
      if (doc.sha && current && current !== doc.sha) {
        throw new CmsError(
          `"${p}" was changed on ${this.cfg.baseBranch} after you loaded it. Reload the editor and re-apply your changes.`,
          'conflict',
        );
      }
      if (!doc.sha && current && changes.upserts.includes(doc)) {
        throw new CmsError(`"${p}" already exists. Choose a different title/filename.`, 'conflict');
      }
    }

    // 3. Build a tree with the new file contents (GitHub creates the blobs for us).
    const treeEntries: Array<Record<string, unknown>> = [
      ...changes.upserts.map((doc) => ({
        path: pathOf(doc),
        mode: '100644',
        type: 'blob',
        content: serializeDocument(doc.values, byName.get(doc.collection)!),
      })),
      ...changes.deletes.map((doc) => ({ path: pathOf(doc), mode: '100644', type: 'blob', sha: null })),
    ];
    const newTree = await this.client.request<{ sha: string }>(`${this.repo}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree: treeEntries }),
    });

    // 4. Commit it on top of main…
    const commit = await this.client.request<{ sha: string }>(`${this.repo}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message: `${meta.title}\n\nSubmitted via the Slow Dough staff editor by @${this.user.login}.`,
        tree: newTree.sha,
        parents: [baseCommitSha],
      }),
    });

    // 5. …on a brand-new feature branch (never main).
    const branch = await this.createBranch(commit.sha);

    // 6. Open the Pull Request for review.
    const pr = await this.client.request<{ html_url: string; number: number }>(`${this.repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title: meta.title,
        head: branch,
        base: this.cfg.baseBranch,
        body: meta.description,
        maintainer_can_modify: true,
      }),
    });

    return {
      kind: 'pull-request',
      url: pr.html_url,
      number: pr.number,
      branch,
      files: treeEntries.map((t) => t.path as string),
    };
  }

  /** `cms/<login>/<yyyymmdd-hhmmss>` – retried with a suffix if the name is already taken. */
  private async createBranch(sha: string): Promise<string> {
    const base = this.branchName();
    for (let attempt = 0; attempt < 3; attempt++) {
      const name = attempt === 0 ? base : `${base}-${attempt + 1}`;
      try {
        await this.client.request(`${this.repo}/git/refs`, {
          method: 'POST',
          body: JSON.stringify({ ref: `refs/heads/${name}`, sha }),
        });
        return name;
      } catch (e) {
        if (e instanceof CmsError && e.code === 'validation' && attempt < 2) continue; // "Reference already exists"
        throw e;
      }
    }
    throw new CmsError('Could not create a branch for this change.', 'unknown');
  }

  branchName(): string {
    const d = this.now();
    const pad = (n: number) => String(n).padStart(2, '0');
    const stamp = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
    const login = this.user.login.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const prefix = this.cfg.branchPrefix.replace(/^\/+|\/+$/g, '') || 'cms';
    const name = `${prefix}/${login}/${stamp}`;
    if (name === this.cfg.baseBranch) throw new CmsError('Refusing to write to the base branch.', 'validation');
    return name;
  }
}
