/**
 * In-memory fake of the slice of the GitHub REST API used by `GitHubBackend`.
 * It records every request so tests can assert on the branch/commit/PR sequence.
 */
import { vi } from 'vitest';

export interface MockRepoFile {
  path: string;
  content: string;
  sha?: string;
}

export interface MockGitHubOptions {
  owner?: string;
  repo?: string;
  login?: string;
  /** Result of /collaborators/:user/permission – 'none' simulates a non-collaborator (403). */
  permission?: 'admin' | 'maintain' | 'write' | 'read' | 'triage' | 'none';
  files?: MockRepoFile[];
  validToken?: string;
  baseBranch?: string;
}

export interface RecordedCall {
  method: string;
  path: string;
  body?: any;
  headers: Record<string, string>;
}

const fakeSha = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(40, '0');
};

export function createMockGitHub(opts: MockGitHubOptions = {}) {
  const owner = opts.owner ?? 'smagara';
  const repo = opts.repo ?? 'SlowDoughPizzaSite_Tina';
  const login = opts.login ?? 'pizza-staff';
  const permission = opts.permission ?? 'write';
  const validToken = opts.validToken ?? 'github_pat_valid';
  const baseBranch = opts.baseBranch ?? 'main';
  const files = new Map<string, MockRepoFile>();
  for (const f of opts.files ?? []) files.set(f.path, { ...f, sha: f.sha ?? fakeSha(f.content) });

  const state = {
    calls: [] as RecordedCall[],
    refs: new Map<string, string>([[`heads/${baseBranch}`, 'basecommit0000000000000000000000000000000']]),
    trees: new Map<string, Array<Record<string, unknown>>>(),
    commits: new Map<string, { tree: string; parents: string[]; message: string }>(),
    pulls: [] as Array<Record<string, unknown>>,
    files,
    /** Simulate `main` moving after the editor loaded a file. */
    bumpFile(path: string, content: string) {
      files.set(path, { path, content, sha: fakeSha(content) });
    },
  };
  state.trees.set('basetree00000000000000000000000000000000', [...files.values()].map((f) => ({ path: f.path, type: 'blob', sha: f.sha })));
  state.commits.set('basecommit0000000000000000000000000000000', { tree: 'basetree00000000000000000000000000000000', parents: [], message: 'init' });

  const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
    new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

  const prefix = `/repos/${owner}/${repo}`;

  const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const method = (init?.method ?? 'GET').toUpperCase();
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const path = url.pathname + (url.search || '');
    state.calls.push({ method, path, body, headers });

    if (headers.Authorization !== `Bearer ${validToken}`) return json(401, { message: 'Bad credentials' });

    if (path === '/user') return json(200, { login, name: 'Pizza Staff', avatar_url: 'https://avatars.example/1' });

    if (path === `${prefix}/collaborators/${login}/permission`) {
      if (permission === 'none') return json(403, { message: 'Must have push access to view collaborator permission.' });
      return json(200, { permission: permission === 'maintain' || permission === 'triage' ? (permission === 'maintain' ? 'write' : 'read') : permission, role_name: permission });
    }
    if (path === prefix) {
      const push = ['admin', 'maintain', 'write'].includes(permission);
      return json(200, { full_name: `${owner}/${repo}`, permissions: { admin: permission === 'admin', maintain: permission === 'maintain', push, pull: true } });
    }

    // Contents API
    const contents = path.match(new RegExp(`^${prefix}/contents/([^?]+)(\\?ref=(.+))?$`));
    if (contents && method === 'GET') {
      const p = decodeURIComponent(contents[1]);
      const file = files.get(p);
      if (file) {
        if (headers.Accept?.includes('raw')) return new Response(file.content, { status: 200 });
        return json(200, { name: p.split('/').pop(), path: p, sha: file.sha, type: 'file', content: btoa(unescape(encodeURIComponent(file.content))), encoding: 'base64' });
      }
      const dir = [...files.values()].filter((f) => f.path.startsWith(`${p}/`) && !f.path.slice(p.length + 1).includes('/'));
      if (dir.length) return json(200, dir.map((f) => ({ name: f.path.split('/').pop(), path: f.path, sha: f.sha, type: 'file' })));
      return json(404, { message: 'Not Found' });
    }

    // Git Data API
    const ref = path.match(new RegExp(`^${prefix}/git/ref/(.+)$`));
    if (ref && method === 'GET') {
      const sha = state.refs.get(ref[1]);
      return sha ? json(200, { ref: `refs/${ref[1]}`, object: { sha, type: 'commit' } }) : json(404, { message: 'Not Found' });
    }
    const commit = path.match(new RegExp(`^${prefix}/git/commits/(.+)$`));
    if (commit && method === 'GET') {
      const c = state.commits.get(commit[1]);
      return c ? json(200, { sha: commit[1], tree: { sha: c.tree }, parents: c.parents.map((p) => ({ sha: p })) }) : json(404, { message: 'Not Found' });
    }
    const tree = path.match(new RegExp(`^${prefix}/git/trees/([^?]+)`));
    if (tree && method === 'GET') {
      const t = state.trees.get(tree[1]);
      return t ? json(200, { sha: tree[1], tree: t }) : json(404, { message: 'Not Found' });
    }
    if (path === `${prefix}/git/trees` && method === 'POST') {
      const base = state.trees.get(body.base_tree) ?? [];
      const next = base.filter((e) => !body.tree.some((t: any) => t.path === e.path));
      for (const t of body.tree) {
        if (t.sha === null) continue; // deletion
        next.push({ path: t.path, type: 'blob', sha: fakeSha(t.content ?? ''), content: t.content });
      }
      const sha = fakeSha(JSON.stringify(next) + state.trees.size);
      state.trees.set(sha, next);
      return json(201, { sha });
    }
    if (path === `${prefix}/git/commits` && method === 'POST') {
      const sha = fakeSha(body.message + body.tree + state.commits.size);
      state.commits.set(sha, { tree: body.tree, parents: body.parents, message: body.message });
      return json(201, { sha });
    }
    if (path === `${prefix}/git/refs` && method === 'POST') {
      const name = String(body.ref).replace(/^refs\//, '');
      if (state.refs.has(name)) return json(422, { message: 'Reference already exists' });
      state.refs.set(name, body.sha);
      return json(201, { ref: body.ref, object: { sha: body.sha } });
    }
    if (path === `${prefix}/pulls` && method === 'POST') {
      if (!state.refs.has(`heads/${body.head}`)) return json(422, { message: 'head branch does not exist' });
      const number = state.pulls.length + 1;
      const pr = { number, html_url: `https://github.com/${owner}/${repo}/pull/${number}`, ...body };
      state.pulls.push(pr);
      return json(201, pr);
    }
    return json(404, { message: `Unhandled ${method} ${path}` });
  });

  return { fetchImpl: fetchImpl as unknown as typeof fetch, state, validToken, login, owner, repo, baseBranch };
}

/** The four content files as they exist in this repository (small subset for tests). */
export const SAMPLE_FILES: MockRepoFile[] = [
  {
    path: 'content/settings/announcement.json',
    content: JSON.stringify({ enabled: true, headline: "Today's Dough: 72-Hour Cold Cellar Ferment", detail: 'Doors open at 4:30 PM (Wed–Sun)' }, null, 2) + '\n',
  },
  {
    path: 'content/menu/menu.json',
    content:
      JSON.stringify(
        {
          eyebrow: 'Seasonal Artisanal Selections',
          title: 'Our Daily Menu',
          intro: 'Every pizza is hand stretched.',
          categories: [
            {
              id: 'neapolitan-pies',
              title: 'Neapolitan Pizzas',
              subtitle: 'Classic',
              items: [
                { id: 'margherita-verace', name: 'Margherita Verace D.O.P.', italianName: '', description: 'Tomato, mozzarella, basil.', price: 19, tags: ['Vegetarian'], isVegetarian: true, isVegan: false },
              ],
            },
          ],
        },
        null,
        2,
      ) + '\n',
  },
  {
    path: 'content/posts/importance-of-dough-aging.json',
    content:
      JSON.stringify(
        {
          title: 'The Architecture of Time',
          subtitle: 'Why we wait.',
          author: 'Marco Bellini',
          authorRole: 'Head Baker',
          readTime: '4 min read',
          publishedDate: '2026-09-14T00:00:00.000Z',
          artType: 'dough',
          draft: false,
          excerpt: 'Long cold fermentation matters.',
          keyTakeaways: ['Enzymes work slowly.'],
          content: [{ sectionHeading: 'Intro', paragraphs: ['Paragraph one.'], quote: '' }],
        },
        null,
        2,
      ) + '\n',
  },
  {
    path: 'content/hours/hours.json',
    content:
      JSON.stringify(
        {
          schedule: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => ({
            day,
            hours: i < 2 ? 'Closed' : '4:30 PM – 9:30 PM',
            statusNote: '',
            isClosed: i < 2,
          })),
        },
        null,
        2,
      ) + '\n',
  },
];
