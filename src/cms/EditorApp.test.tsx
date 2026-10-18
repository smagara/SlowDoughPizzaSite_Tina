import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collections } from '../../tina/schema';
import { LocalTinaBackend } from './backends/localTina';
import { cmsConfig } from './config';
import { EditorApp, TOKEN_STORAGE_KEY } from './EditorApp';
import { createMockGitHub, SAMPLE_FILES } from '../test/mockGitHub';

beforeEach(() => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

/** Routes GitHub calls to the mock and makes the local Tina probe fail (production behaviour). */
function productionFetch(gh: ReturnType<typeof createMockGitHub>): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith('https://api.github.com')) return gh.fetchImpl(input, init);
    throw new TypeError('Failed to fetch');
  }) as typeof fetch;
}

async function signIn(user: ReturnType<typeof userEvent.setup>, token: string) {
  await user.type(await screen.findByLabelText(/GitHub personal access token/i), token);
  await user.click(screen.getByRole('button', { name: /^Sign in$/ }));
}

describe('EditorApp – GitHub review mode (production)', () => {
  it('asks for a token when no local Tina server is running', async () => {
    const gh = createMockGitHub({ files: SAMPLE_FILES });
    render(<EditorApp fetchImpl={productionFetch(gh)} isDev={false} />);
    expect(await screen.findByRole('heading', { name: /Sign in with GitHub/ })).toBeInTheDocument();
    expect(screen.getByText(/Only GitHub collaborators with write access/)).toBeInTheDocument();
  });

  it('denies users who are not collaborators with write access', async () => {
    const user = userEvent.setup();
    const gh = createMockGitHub({ files: SAMPLE_FILES, permission: 'read' });
    render(<EditorApp fetchImpl={productionFetch(gh)} isDev={false} />);
    await signIn(user, gh.validToken);
    expect(await screen.findByRole('alert')).toHaveTextContent(/not a collaborator with write access/);
    expect(screen.queryByRole('button', { name: /Review & submit/ })).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('rejects a bad token', async () => {
    const user = userEvent.setup();
    const gh = createMockGitHub({ files: SAMPLE_FILES });
    render(<EditorApp fetchImpl={productionFetch(gh)} isDev={false} />);
    await signIn(user, 'github_pat_nope');
    expect(await screen.findByRole('alert')).toHaveTextContent(/rejected the access token/);
  });

  it('lets a collaborator edit the announcement, blocks script input, then opens a PR on a feature branch', async () => {
    const user = userEvent.setup();
    const gh = createMockGitHub({ files: SAMPLE_FILES, permission: 'write' });
    render(<EditorApp fetchImpl={productionFetch(gh)} isDev={false} />);
    await signIn(user, gh.validToken);

    // Signed in, content loaded from GitHub main
    expect(await screen.findByText('GitHub review mode')).toBeInTheDocument();
    expect(await screen.findByText(/@pizza-staff/)).toBeInTheDocument();
    const headline = (await screen.findByLabelText(/^Headline/)) as HTMLInputElement;
    expect(headline.value).toBe("Today's Dough: 72-Hour Cold Cellar Ferment");
    expect(window.sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBe(gh.validToken);

    // Script characters are rejected and submission is blocked
    await user.clear(headline);
    await user.type(headline, 'Fresh <script>alert(1)</script>');
    expect(await screen.findByRole('alert')).toHaveTextContent(/Angle brackets/);
    expect(screen.getByRole('button', { name: /Review & submit for approval/ })).toBeDisabled();
    expect(document.getElementById('cms-error-count')).toHaveTextContent('1 issue to fix');

    // A valid edit enables review
    await user.clear(headline);
    await user.type(headline, 'Fresh batch: 96-hour weekend dough');
    await waitFor(() => expect(screen.getByRole('button', { name: /Review & submit for approval/ })).toBeEnabled());
    expect(document.getElementById('cms-dirty-count')).toHaveTextContent('1 file changed');
    await user.click(screen.getByRole('button', { name: /Review & submit for approval/ }));

    // Review dialog summarises the change
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Headline')).toBeInTheDocument();
    expect(within(dialog).getByText('Fresh batch: 96-hour weekend dough')).toBeInTheDocument();
    const title = within(dialog).getByLabelText(/Title for the reviewer/) as HTMLInputElement;
    expect(title.value).toBe('Content update: Dough Announcement');
    await user.type(within(dialog).getByLabelText(/Note/), 'Weekend special');
    await user.click(within(dialog).getByRole('button', { name: /Open Pull Request/ }));

    // Result panel links to the PR
    const result = await screen.findByText(/Pull Request #1 opened/);
    expect(result).toBeInTheDocument();
    const link = document.getElementById('cms-pr-link') as HTMLAnchorElement;
    expect(link.href).toBe('https://github.com/smagara/SlowDoughPizzaSite_Tina/pull/1');

    // GitHub state: main untouched, feature branch + PR created
    expect(gh.state.refs.get('heads/main')).toBe('basecommit0000000000000000000000000000000');
    const branches = [...gh.state.refs.keys()].filter((r) => r !== 'heads/main');
    expect(branches).toHaveLength(1);
    expect(branches[0]).toMatch(/^heads\/cms\/pizza-staff\/\d{8}-\d{6}$/);
    expect(gh.state.pulls[0]).toMatchObject({ base: 'main', head: branches[0].replace('heads/', ''), title: 'Content update: Dough Announcement' });
    expect(String(gh.state.pulls[0].body)).toContain('Weekend special');
    expect(String(gh.state.pulls[0].body)).toContain('Headline');

    // Editor is clean again
    await waitFor(() => expect(screen.getByText('No unsaved changes')).toBeInTheDocument());
  });

  it('restores a saved session token and supports sign out', async () => {
    const user = userEvent.setup();
    const gh = createMockGitHub({ files: SAMPLE_FILES });
    window.sessionStorage.setItem(TOKEN_STORAGE_KEY, gh.validToken);
    render(<EditorApp fetchImpl={productionFetch(gh)} isDev={false} />);
    expect(await screen.findByText(/@pizza-staff/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Sign out/ }));
    expect(await screen.findByRole('heading', { name: /Sign in with GitHub/ })).toBeInTheDocument();
    expect(window.sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('creates a new blog post, validates it, and shows it as part of the PR', async () => {
    const user = userEvent.setup();
    const gh = createMockGitHub({ files: SAMPLE_FILES });
    window.sessionStorage.setItem(TOKEN_STORAGE_KEY, gh.validToken);
    render(<EditorApp fetchImpl={productionFetch(gh)} isDev={false} />);
    await user.click(await screen.findByRole('button', { name: 'Blog Posts' }));
    expect(await screen.findByRole('heading', { level: 3, name: 'The Architecture of Time' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /New post/ }));
    await user.type(screen.getByLabelText(/Title for the new post/), 'Why San Marzano Tomatoes Matter');
    expect(screen.getByText(/why-san-marzano-tomatoes-matter\.json/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Create draft/ }));

    // New post form opens with defaults; required fields missing → issues reported
    expect(await screen.findByRole('heading', { level: 2, name: 'Why San Marzano Tomatoes Matter' })).toBeInTheDocument();
    expect(document.getElementById('cms-error-count')).toHaveTextContent(/issue/);
    await user.type(screen.getByLabelText('Author *'), 'Marco Bellini');
    await user.type(screen.getByLabelText(/^Excerpt/), 'Only D.O.P. tomatoes from the volcanic soil of Campania.');
    await user.type(screen.getByLabelText('Paragraphs 1'), 'The first paragraph of our tomato essay.');
    await waitFor(() => expect(document.getElementById('cms-error-count')).toBeNull());

    await user.click(screen.getByRole('button', { name: /Review & submit for approval/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Blog Posts · Why San Marzano Tomatoes Matter/)).toBeInTheDocument();
    expect(within(dialog).getByText('created')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /Open Pull Request/ }));
    await screen.findByText(/Pull Request #1 opened/);
    const treeCall = gh.state.calls.find((c) => c.method === 'POST' && c.path.endsWith('/git/trees'))!;
    const entry = treeCall.body.tree.find((t: any) => t.path === 'content/posts/why-san-marzano-tomatoes-matter.json');
    expect(entry).toBeDefined();
    const written = JSON.parse(entry.content);
    expect(written).toMatchObject({ title: 'Why San Marzano Tomatoes Matter', author: 'Marco Bellini', draft: true, artType: 'dough' });
  });

  it('edits a menu price and surfaces the change in the PR body', async () => {
    const user = userEvent.setup();
    const gh = createMockGitHub({ files: SAMPLE_FILES });
    window.sessionStorage.setItem(TOKEN_STORAGE_KEY, gh.validToken);
    render(<EditorApp fetchImpl={productionFetch(gh)} isDev={false} />);
    await user.click(await screen.findByRole('button', { name: 'Daily Menu' }));
    // Small lists are expanded by default; collapse/expand toggles the item card
    const itemToggle = await screen.findByRole('button', { name: /^Margherita Verace D\.O\.P\. — \$19$/ });
    expect(itemToggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(itemToggle);
    expect(screen.queryByLabelText(/Price \(USD\)/)).not.toBeInTheDocument();
    await user.click(itemToggle);
    const price = screen.getByLabelText(/Price \(USD\)/) as HTMLInputElement;
    expect(price.value).toBe('19');
    // Number inputs sanitise partial values, so set the value in one go rather than typing char by char.
    fireEvent.change(price, { target: { value: '-4' } });
    expect(await screen.findByRole('alert')).toHaveTextContent(/negative/);
    fireEvent.change(price, { target: { value: '21' } });
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Review & submit for approval/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Price \(USD\)/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /Open Pull Request/ }));
    await screen.findByText(/Pull Request #1 opened/);
    expect(String(gh.state.pulls[0].body)).toMatch(/Margherita Verace D\.O\.P\. — \$21 › Price \(USD\): 19 → 21/);
  });
});

describe('EditorApp – local edit mode (development)', () => {
  it('uses the Tina dev server when it is reachable and saves without GitHub', async () => {
    const user = userEvent.setup();
    const store: Record<string, Record<string, Record<string, unknown>>> = {
      announcement: { 'announcement.json': { enabled: true, headline: 'Local headline', detail: '' } },
      menu: { 'menu.json': JSON.parse(SAMPLE_FILES[1].content) },
      post: { 'importance-of-dough-aging.json': JSON.parse(SAMPLE_FILES[2].content) },
      hours: { 'hours.json': JSON.parse(SAMPLE_FILES[3].content) },
    };
    const localFetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      const { query, variables = {} } = JSON.parse(String(init?.body));
      const respond = (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 });
      if (query.includes('collection(collection')) {
        return respond({
          collection: {
            documents: { edges: Object.entries(store[variables.collection] ?? {}).map(([relativePath, values]) => ({ node: { _sys: { relativePath }, _values: { _collection: variables.collection, ...values } } })) },
          },
        });
      }
      if (query.includes('document(collection')) return respond({ document: store[variables.collection]?.[variables.relativePath] ? { __typename: 'Doc' } : null });
      if (query.includes('updateDocument')) {
        store[variables.collection][variables.relativePath] = variables.params[variables.collection];
        return respond({ updateDocument: { __typename: 'Doc' } });
      }
      return respond({ __typename: 'Query' });
    }) as typeof fetch;

    render(<EditorApp fetchImpl={localFetch} isDev config={{ ...cmsConfig, mode: 'auto' }} collections={collections} />);
    expect((await screen.findAllByText('Local edit mode')).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Sign in with GitHub/)).not.toBeInTheDocument();
    const headline = (await screen.findByLabelText(/^Headline/)) as HTMLInputElement;
    expect(headline.value).toBe('Local headline');
    await user.clear(headline);
    await user.type(headline, 'Edited locally');
    await user.click(screen.getByRole('button', { name: /Review & save/ }));
    await user.click(await screen.findByRole('button', { name: /Save files/ }));
    expect(await screen.findByText('Saved locally')).toBeInTheDocument();
    expect(store.announcement['announcement.json'].headline).toBe('Edited locally');
  });

  it('can be forced into GitHub mode even in development', async () => {
    const gh = createMockGitHub({ files: SAMPLE_FILES });
    render(<EditorApp fetchImpl={productionFetch(gh)} isDev config={{ ...cmsConfig, mode: 'github' }} />);
    expect(await screen.findByRole('heading', { name: /Sign in with GitHub/ })).toBeInTheDocument();
  });

  it('exposes LocalTinaBackend availability probing', async () => {
    expect(await LocalTinaBackend.isAvailable('http://localhost:4001/graphql', (async () => new Response('{}', { status: 500 })) as typeof fetch)).toBe(false);
  });
});
