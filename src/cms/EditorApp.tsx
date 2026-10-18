import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Collection } from 'tinacms';
import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, GitPullRequest, LogOut, RefreshCw } from 'lucide-react';
import { collections as schemaCollections } from '../../tina/schema';
import { GitHubBackend, GitHubClient, type GitHubUser } from './backends/github';
import { LocalTinaBackend } from './backends/localTina';
import { CmsError, type ContentBackend } from './backends/types';
import { CollectionEditor } from './components/CollectionEditor';
import { ReviewDialog } from './components/ReviewDialog';
import { SignIn, type RememberChoice } from './components/SignIn';
import { Badge, Button, Card, Notice } from './components/ui';
import { cmsConfig, repoUrl, type CmsConfig } from './config';
import { changeSummaryMarkdown, collectionLabel, summarizeChanges } from './diff';
import type { SubmitResult } from './documents';
import { clearVault, openVault, rememberedUsers, saveToVault, VaultError, type RememberedUser } from './tokenVault';
import { useEditorStore } from './useEditorStore';

export const TOKEN_STORAGE_KEY = 'slowdough.cms.github-token';

export interface EditorAppProps {
  collections?: Collection[];
  config?: CmsConfig;
  /** Test seam: pre-built backend skips mode detection and sign-in. */
  backend?: ContentBackend;
  user?: GitHubUser;
  /** Test seam: replaces `fetch` for GitHub / Tina calls. */
  fetchImpl?: typeof fetch;
  /** Whether to probe for the local Tina server (defaults to Vite dev mode). */
  isDev?: boolean;
  onExit?: () => void;
}

type Session =
  | { status: 'detecting' }
  | { status: 'signed-out'; error?: string; busy?: boolean; remembered?: RememberedUser[]; lockedReason?: string }
  | { status: 'ready'; backend: ContentBackend; user?: GitHubUser };

/**
 * Staff content editor. Reached via the hidden `#/edit` link in the footer.
 *
 *   Local mode  → `npm run dev` is running, so edits go through Tina's local GraphQL API.
 *   GitHub mode → production (GitHub Pages): sign in with a GitHub token; every submission
 *                 becomes a feature branch + Pull Request for approval.
 */
export const EditorApp: React.FC<EditorAppProps> = ({
  collections = schemaCollections,
  config = cmsConfig,
  backend: injectedBackend,
  user: injectedUser,
  fetchImpl,
  isDev = import.meta.env?.DEV ?? false,
  onExit,
}) => {
  const store = useEditorStore(collections);
  const [session, setSession] = useState<Session>(() =>
    injectedBackend ? { status: 'ready', backend: injectedBackend, user: injectedUser } : { status: 'detecting' },
  );
  const [activeTab, setActiveTab] = useState(collections[0]?.name ?? '');
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [result, setResult] = useState<SubmitResult | undefined>();

  const doFetch = useMemo<typeof fetch>(() => fetchImpl ?? ((...args) => fetch(...args)), [fetchImpl]);

  // ---- mode detection & token restore -------------------------------------------------------
  const signIn = useCallback(
    async (token: string, remember?: RememberChoice) => {
      setSession({ status: 'signed-out', busy: true, remembered: rememberedUsers() });
      try {
        const client = new GitHubClient(token, doFetch);
        const user = await GitHubBackend.verifyAccess(client, config);
        window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
        if (remember) {
          // Only a verified, authorised token is ever remembered on the device.
          await saveToVault(token, remember.passcode, user.login);
        }
        setSession({ status: 'ready', backend: new GitHubBackend(client, user, config, undefined, collections), user });
      } catch (e) {
        window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        const message = e instanceof CmsError || e instanceof VaultError ? e.message : 'Could not sign in. Please try again.';
        setSession({ status: 'signed-out', error: message, remembered: rememberedUsers() });
      }
    },
    [collections, config, doFetch],
  );

  const unlock = useCallback(
    async (login: string, passcode: string) => {
      setSession({ status: 'signed-out', busy: true, remembered: rememberedUsers() });
      try {
        const { token } = await openVault(passcode, login);
        await signIn(token);
      } catch (e) {
        const message = e instanceof VaultError ? e.message : 'Could not unlock. Please try again.';
        setSession({ status: 'signed-out', error: message, remembered: rememberedUsers() });
      }
    },
    [signIn],
  );

  const forgetDevice = useCallback((login?: string) => {
    clearVault(login);
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setSession({ status: 'signed-out', remembered: rememberedUsers() });
  }, []);

  useEffect(() => {
    if (injectedBackend) return;
    let cancelled = false;
    (async () => {
      const wantLocal = config.mode === 'local' || (config.mode === 'auto' && isDev);
      if (wantLocal && (await LocalTinaBackend.isAvailable(config.tinaLocalUrl, doFetch))) {
        if (!cancelled) setSession({ status: 'ready', backend: new LocalTinaBackend(config.tinaLocalUrl, doFetch) });
        return;
      }
      const saved = window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (saved) {
        await signIn(saved);
        return;
      }
      if (!cancelled) setSession({ status: 'signed-out', remembered: rememberedUsers() });
    })();
    return () => {
      cancelled = true;
    };
  }, [config, doFetch, injectedBackend, isDev, signIn]);

  // ---- load content once a backend exists ---------------------------------------------------
  const backend = session.status === 'ready' ? session.backend : undefined;
  useEffect(() => {
    if (backend) void store.load(backend);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend]);

  const signOut = () => {
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setResult(undefined);
    setSession({ status: 'signed-out', remembered: rememberedUsers() });
  };

  // Shared-counter hygiene: lock a GitHub session after a period of inactivity. Unsaved edits are
  // lost on lock, so the warning bar counts down the last minute.
  const isGitHubSession = session.status === 'ready' && session.backend.kind === 'github';
  const [idleWarning, setIdleWarning] = useState(false);
  useEffect(() => {
    if (!isGitHubSession || !config.idleLockMinutes) return;
    const limit = config.idleLockMinutes * 60_000;
    let last = Date.now();
    const bump = () => {
      last = Date.now();
      setIdleWarning(false);
    };
    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'pointerdown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const timer = window.setInterval(() => {
      const idle = Date.now() - last;
      if (idle >= limit) {
        window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        setResult(undefined);
        setReviewing(false);
        setIdleWarning(false);
        setSession({ status: 'signed-out', remembered: rememberedUsers(), lockedReason: `Locked after ${config.idleLockMinutes} minutes without activity. Unsaved edits were discarded.` });
      } else if (idle >= limit - 60_000) {
        setIdleWarning(true);
      }
    }, 5_000);
    return () => {
      window.clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, bump));
    };
  }, [isGitHubSession, config.idleLockMinutes]);

  const exit = () => {
    if (store.dirtyCount > 0 && !window.confirm('You have unsaved changes. Leave the editor anyway?')) return;
    if (onExit) onExit();
    else window.location.hash = '';
  };

  const summary = useMemo(() => summarizeChanges(collections, store.originals, store.changeSet), [collections, store.originals, store.changeSet]);
  const defaultTitle = `Content update: ${summary.collectionsTouched.join(', ') || 'site content'}`;

  const confirmSubmit = async (title: string, note: string) => {
    if (!backend) return;
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const author = session.status === 'ready' && session.user ? session.user.login : 'local-editor';
      const res = await backend.submit(store.changeSet, { title, description: changeSummaryMarkdown(summary, author, note) });
      setResult(res);
      setReviewing(false);
      await store.load(backend); // refresh originals so the editor is clean again
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  // ---- render --------------------------------------------------------------------------------
  const user = session.status === 'ready' ? session.user : undefined;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#24211e] flex flex-col" id="cms-editor">
      <header className="sticky top-0 z-40 bg-[#faf8f5]/95 backdrop-blur-md border-b border-[#e6ddd2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button type="button" onClick={exit} className="p-2 rounded-lg text-[#5c5044] hover:bg-[#f0e8dc] cursor-pointer" aria-label="Back to website" id="cms-exit-btn">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <span className="block font-serif text-2xl font-bold tracking-tight text-[#24211e] truncate">Slow Dough</span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.2em] text-[#7d7165]">Staff Content Editor</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {backend && <Badge tone={backend.kind === 'local' ? 'warn' : 'accent'}>{backend.kind === 'local' ? 'Local edit mode' : 'GitHub review mode'}</Badge>}
            {user && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-[#5c5044]">
                {user.avatarUrl && <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full border border-[#ded3c5]" />}
                <span>
                  @{user.login} · <span className="font-mono">{user.permission}</span>
                </span>
              </div>
            )}
            {session.status === 'ready' && session.backend.kind === 'github' && (
              <Button size="sm" variant="ghost" onClick={signOut} id="cms-sign-out-btn">
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-32 space-y-8">
        {session.status === 'detecting' && <p className="text-sm text-[#75685c]">Checking for a local Tina server…</p>}

        {session.status === 'signed-out' && (
          <SignIn onSubmit={signIn} onUnlock={unlock} onForgetDevice={forgetDevice} remembered={session.remembered} lockedReason={session.lockedReason} error={session.error} busy={session.busy} />
        )}

        {idleWarning && session.status === 'ready' && (
          <Notice tone="warn" title="Still there?">
            This session locks in about a minute without activity. Move the mouse or press a key to stay signed in; submit or save if you have changes.
          </Notice>
        )}

        {session.status === 'ready' && (
          <>
            {backend?.kind === 'local' && (
              <Notice tone="warn" title="Local edit mode">
                Changes save straight into <code>content/</code> through the Tina dev server. The full Tina admin is also available at{' '}
                <a className="underline" href={`${import.meta.env.BASE_URL}admin/index.html`} target="_blank" rel="noreferrer">
                  /admin/index.html
                </a>
                .
              </Notice>
            )}

            {result && <ResultPanel result={result} onDismiss={() => setResult(undefined)} />}

            {store.state.status === 'loading' && <p className="text-sm text-[#75685c]">Loading content…</p>}
            {store.state.status === 'error' && (
              <Notice tone="error" title="Could not load content">
                {store.state.error}
                <div className="mt-3">
                  <Button size="sm" onClick={() => backend && store.load(backend)}>
                    <RefreshCw className="w-3.5 h-3.5" /> Try again
                  </Button>
                </div>
              </Notice>
            )}

            {store.state.status === 'ready' && (
              <>
                <nav className="flex flex-wrap items-center gap-2" aria-label="Content sections">
                  {collections.map((c) => {
                    const dirty = (store.state.docs[c.name] ?? []).some((d) => store.isDirty(d));
                    const errs = store.validation.filter((v) => v.collection === c.name).reduce((n, v) => n + v.errors.length, 0);
                    const active = activeTab === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        id={`cms-tab-${c.name}`}
                        onClick={() => setActiveTab(c.name)}
                        aria-current={active ? 'page' : undefined}
                        className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
                          active ? 'bg-[#24211e] text-[#faf8f5] shadow-xs' : 'bg-[#f0e8dc] text-[#54483d] hover:bg-[#e4d8cb]'
                        }`}
                      >
                        {collectionLabel(c)}
                        {dirty && <span className={`w-2 h-2 rounded-full ${errs ? 'bg-[#e28859]' : 'bg-[#c85a32]'}`} aria-label="has unsaved changes" />}
                      </button>
                    );
                  })}
                </nav>

                {collections
                  .filter((c) => c.name === activeTab)
                  .map((c) => (
                    <CollectionEditor key={c.name} collection={c} store={store} />
                  ))}
              </>
            )}
          </>
        )}
      </main>

      {/* Sticky action bar */}
      {session.status === 'ready' && store.state.status === 'ready' && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-[#24211e] text-[#f4efe8] border-t border-[#3b342d]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs sm:text-sm flex items-center gap-3">
              {store.dirtyCount === 0 ? (
                <span className="text-[#a39688]">No unsaved changes</span>
              ) : (
                <span id="cms-dirty-count">
                  <strong>{store.dirtyCount}</strong> file{store.dirtyCount === 1 ? '' : 's'} changed
                </span>
              )}
              {store.errorCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[#e9a989]" id="cms-error-count">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {store.errorCount} issue{store.errorCount === 1 ? '' : 's'} to fix
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="darkGhost" disabled={store.dirtyCount === 0} onClick={() => window.confirm('Discard all unsaved changes?') && store.discardAll()}>
                Discard
              </Button>
              <Button
                size="sm"
                id="cms-review-btn"
                variant="accent"
                disabled={store.dirtyCount === 0 || store.errorCount > 0}
                onClick={() => {
                  setSubmitError(undefined);
                  setReviewing(true);
                }}
              >
                <GitPullRequest className="w-4 h-4" />
                {backend?.kind === 'github' ? 'Review & submit for approval' : 'Review & save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {reviewing && backend && (
        <ReviewDialog backend={backend} summary={summary} defaultTitle={defaultTitle} busy={submitting} error={submitError} onCancel={() => setReviewing(false)} onConfirm={confirmSubmit} />
      )}
    </div>
  );
};

const ResultPanel: React.FC<{ result: SubmitResult; onDismiss: () => void }> = ({ result, onDismiss }) => (
  <Card className="p-6 border-[#c9dcc1] bg-[#eef4ea]" id="cms-result">
    <div className="flex items-start gap-3">
      <CheckCircle2 className="w-6 h-6 text-[#335928] shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2 text-sm text-[#2f4f27]">
        {result.kind === 'pull-request' ? (
          <>
            <h3 className="font-serif text-xl font-bold text-[#24211e]">Pull Request #{result.number} opened</h3>
            <p>
              Your changes are on branch <code>{result.branch}</code> and are waiting for approval. Once the owner merges the Pull Request, the website republishes automatically
              (usually within two minutes).
            </p>
            <a href={result.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold underline decoration-[#c85a32]/60 hover:text-[#c85a32]" id="cms-pr-link">
              View the Pull Request on GitHub <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </>
        ) : (
          <>
            <h3 className="font-serif text-xl font-bold text-[#24211e]">Saved locally</h3>
            <p>
              Tina wrote {result.files.length} file(s). Open the website in another tab to check it — it hot-reloads on its own, but{' '}
              <strong>refresh the page (F5) if you do not see the change</strong>. Commit with git when you are happy.
            </p>
            <a href={import.meta.env.BASE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold underline decoration-[#c85a32]/60 hover:text-[#c85a32]">
              Open the website in a new tab <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <ul className="list-disc pl-5 text-xs font-mono">
              {result.files.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </>
        )}
      </div>
      <Button size="sm" variant="ghost" onClick={onDismiss} aria-label="Dismiss">
        ✕
      </Button>
    </div>
    <p className="mt-3 text-xs text-[#5c5044]">
      Repository: <a className="underline" href={repoUrl()} target="_blank" rel="noreferrer">{repoUrl()}</a>
    </p>
  </Card>
);

export default EditorApp;
