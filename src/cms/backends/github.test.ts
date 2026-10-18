import { describe, expect, it } from 'vitest';
import { collections, postCollection } from '../../../tina/schema';
import { cmsConfig } from '../config';
import type { CmsDocument } from '../documents';
import { createMockGitHub, SAMPLE_FILES } from '../../test/mockGitHub';
import { GitHubBackend, GitHubClient } from './github';
import { CmsError } from './types';

const FIXED_DATE = new Date('2026-10-18T14:05:09Z');

function setup(opts: Parameters<typeof createMockGitHub>[0] = {}) {
  const gh = createMockGitHub({ files: SAMPLE_FILES, ...opts });
  const client = new GitHubClient(gh.validToken, gh.fetchImpl);
  return { gh, client };
}

describe('GitHubBackend.verifyAccess', () => {
  it('accepts collaborators with write access', async () => {
    const { client } = setup({ permission: 'write' });
    const user = await GitHubBackend.verifyAccess(client);
    expect(user).toMatchObject({ login: 'pizza-staff', permission: 'write' });
  });

  it('accepts admins and maintainers', async () => {
    expect((await GitHubBackend.verifyAccess(setup({ permission: 'admin' }).client)).permission).toBe('admin');
    expect((await GitHubBackend.verifyAccess(setup({ permission: 'maintain' }).client)).permission).toBe('maintain');
  });

  it('rejects read-only collaborators', async () => {
    const { client } = setup({ permission: 'read' });
    await expect(GitHubBackend.verifyAccess(client)).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('rejects non-collaborators (403 from the permission endpoint, no push permission on repo)', async () => {
    const { client, gh } = setup({ permission: 'none' });
    await expect(GitHubBackend.verifyAccess(client)).rejects.toThrow(/not a collaborator with write access/);
    // It fell back to the repository permission summary rather than giving up.
    expect(gh.state.calls.map((c) => c.path)).toContain(`/repos/${gh.owner}/${gh.repo}`);
  });

  it('rejects invalid tokens', async () => {
    const gh = createMockGitHub();
    const client = new GitHubClient('github_pat_WRONG', gh.fetchImpl);
    await expect(GitHubBackend.verifyAccess(client)).rejects.toMatchObject({ code: 'unauthenticated' });
  });

  it('sends the GitHub API version header and a bearer token', async () => {
    const { client, gh } = setup();
    await GitHubBackend.verifyAccess(client);
    const call = gh.state.calls[0];
    expect(call.headers.Authorization).toBe(`Bearer ${gh.validToken}`);
    expect(call.headers['X-GitHub-Api-Version']).toBe('2022-11-28');
  });
});

describe('GitHubBackend.listDocuments', () => {
  it('reads every JSON file in the collection folder from the base branch', async () => {
    const { client, gh } = setup();
    const user = await GitHubBackend.verifyAccess(client);
    const backend = new GitHubBackend(client, user, cmsConfig, () => FIXED_DATE);
    const docs = await backend.listDocuments(postCollection);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ collection: 'post', relativePath: 'importance-of-dough-aging.json' });
    expect(docs[0].values.title).toBe('The Architecture of Time');
    expect(docs[0].sha).toBeDefined();
    expect(gh.state.calls.some((c) => c.path.includes('/contents/content/posts?ref=main'))).toBe(true);
  });

  it('surfaces invalid JSON as a validation error', async () => {
    const { client } = setup({ files: [{ path: 'content/posts/bad.json', content: '{ not json' }] });
    const user = await GitHubBackend.verifyAccess(client);
    const backend = new GitHubBackend(client, user, cmsConfig, () => FIXED_DATE);
    await expect(backend.listDocuments(postCollection)).rejects.toMatchObject({ code: 'validation' });
  });
});

describe('GitHubBackend.submit – feature branch + Pull Request', () => {
  async function readyBackend(opts: Parameters<typeof createMockGitHub>[0] = {}) {
    const { client, gh } = setup(opts);
    const user = await GitHubBackend.verifyAccess(client);
    const backend = new GitHubBackend(client, user, cmsConfig, () => FIXED_DATE, collections);
    gh.state.calls.length = 0;
    return { backend, gh };
  }

  it('never touches main: creates cms/<user>/<timestamp> branch, one commit, and a PR against main', async () => {
    const { backend, gh } = await readyBackend();
    const [announcement] = await backend.listDocuments(collections[0]);
    const edited: CmsDocument = { ...announcement, values: { ...announcement.values, headline: 'Fresh batch today' } };

    const result = await backend.submit({ upserts: [edited], deletes: [] }, { title: 'Content update: Dough Announcement', description: 'body' });

    expect(result.kind).toBe('pull-request');
    if (result.kind !== 'pull-request') throw new Error('unreachable');
    expect(result.branch).toBe('cms/pizza-staff/20261018-140509');
    expect(result.number).toBe(1);
    expect(result.url).toBe('https://github.com/smagara/SlowDoughPizzaSite_Tina/pull/1');
    expect(result.files).toEqual(['content/settings/announcement.json']);

    // main still points at the original commit
    expect(gh.state.refs.get('heads/main')).toBe('basecommit0000000000000000000000000000000');
    // the feature branch exists and carries the new commit whose parent is main
    const branchSha = gh.state.refs.get('heads/cms/pizza-staff/20261018-140509')!;
    expect(gh.state.commits.get(branchSha)?.parents).toEqual(['basecommit0000000000000000000000000000000']);
    expect(gh.state.commits.get(branchSha)?.message).toMatch(/^Content update: Dough Announcement/);

    // PR targets main from the feature branch
    expect(gh.state.pulls[0]).toMatchObject({ head: 'cms/pizza-staff/20261018-140509', base: 'main', title: 'Content update: Dough Announcement', body: 'body' });

    // committed file content is schema-ordered, pretty JSON with a trailing newline
    const tree = gh.state.trees.get(gh.state.commits.get(branchSha)!.tree)!;
    const file = tree.find((t) => t.path === 'content/settings/announcement.json') as { content: string };
    expect(file.content).toBe('{\n  "enabled": true,\n  "headline": "Fresh batch today",\n  "detail": "Doors open at 4:30 PM (Wed–Sun)"\n}\n');

    // No write request ever targets main
    const writes = gh.state.calls.filter((c) => c.method !== 'GET');
    expect(writes.map((c) => c.path)).toEqual([
      '/repos/smagara/SlowDoughPizzaSite_Tina/git/trees',
      '/repos/smagara/SlowDoughPizzaSite_Tina/git/commits',
      '/repos/smagara/SlowDoughPizzaSite_Tina/git/refs',
      '/repos/smagara/SlowDoughPizzaSite_Tina/pulls',
    ]);
    expect(writes.find((c) => c.path.endsWith('/git/refs'))!.body.ref).not.toBe('refs/heads/main');
  });

  it('commits creates, updates and deletes atomically in one commit', async () => {
    const { backend, gh } = await readyBackend();
    const [post] = await backend.listDocuments(postCollection);
    const newPost: CmsDocument = { collection: 'post', relativePath: 'new-essay.json', values: { ...post.values, title: 'New Essay' } };
    const result = await backend.submit({ upserts: [newPost], deletes: [post] }, { title: 't', description: 'd' });
    if (result.kind !== 'pull-request') throw new Error('unreachable');
    expect(result.files.sort()).toEqual(['content/posts/importance-of-dough-aging.json', 'content/posts/new-essay.json']);
    const treeCall = gh.state.calls.find((c) => c.method === 'POST' && c.path.endsWith('/git/trees'))!;
    expect(treeCall.body.tree).toContainEqual({ path: 'content/posts/importance-of-dough-aging.json', mode: '100644', type: 'blob', sha: null });
    expect(gh.state.commits.size).toBe(2);
  });

  it('detects that a file changed on main since it was loaded', async () => {
    const { backend, gh } = await readyBackend();
    const [announcement] = await backend.listDocuments(collections[0]);
    gh.state.bumpFile('content/settings/announcement.json', '{"enabled":true,"headline":"Someone else edited"}\n');
    gh.state.trees.set('basetree00000000000000000000000000000000', [...gh.state.files.values()].map((f) => ({ path: f.path, type: 'blob', sha: f.sha })));
    const edited = { ...announcement, values: { ...announcement.values, headline: 'Mine' } };
    await expect(backend.submit({ upserts: [edited], deletes: [] }, { title: 't', description: 'd' })).rejects.toMatchObject({ code: 'conflict' });
    expect(gh.state.pulls).toHaveLength(0);
    expect(gh.state.refs.size).toBe(1); // no branch created
  });

  it('refuses to create a new post whose file already exists', async () => {
    const { backend } = await readyBackend();
    const dup: CmsDocument = { collection: 'post', relativePath: 'importance-of-dough-aging.json', values: { title: 'x' } };
    await expect(backend.submit({ upserts: [dup], deletes: [] }, { title: 't', description: 'd' })).rejects.toThrow(/already exists/);
  });

  it('retries with a suffix when the branch name is taken', async () => {
    const { backend, gh } = await readyBackend();
    gh.state.refs.set('heads/cms/pizza-staff/20261018-140509', 'deadbeef');
    const [announcement] = await backend.listDocuments(collections[0]);
    const result = await backend.submit({ upserts: [{ ...announcement, values: { ...announcement.values, detail: 'x' } }], deletes: [] }, { title: 't', description: 'd' });
    if (result.kind !== 'pull-request') throw new Error('unreachable');
    expect(result.branch).toBe('cms/pizza-staff/20261018-140509-2');
  });

  it('rejects empty change sets', async () => {
    const { backend } = await readyBackend();
    await expect(backend.submit({ upserts: [], deletes: [] }, { title: 't', description: 'd' })).rejects.toBeInstanceOf(CmsError);
  });

  it('maps GitHub errors to friendly messages', async () => {
    const gh = createMockGitHub({ files: SAMPLE_FILES });
    const client = new GitHubClient(gh.validToken, gh.fetchImpl);
    await expect(client.request('/repos/smagara/SlowDoughPizzaSite_Tina/contents/nope')).rejects.toThrow(/Not found on GitHub/);
    const offline = new GitHubClient('t', (async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch);
    await expect(offline.request('/user')).rejects.toMatchObject({ code: 'network' });
    const limited = new GitHubClient('t', (async () => new Response('{"message":"API rate limit exceeded"}', { status: 403, headers: { 'x-ratelimit-remaining': '0' } })) as unknown as typeof fetch);
    await expect(limited.request('/user')).rejects.toMatchObject({ code: 'rate-limited' });
  });

  it('branch names never equal the base branch', () => {
    const gh = createMockGitHub();
    const backend = new GitHubBackend(new GitHubClient(gh.validToken, gh.fetchImpl), { login: 'Main', permission: 'write' }, { ...cmsConfig, branchPrefix: '' }, () => FIXED_DATE);
    expect(backend.branchName()).toBe('cms/main/20261018-140509');
  });
});
