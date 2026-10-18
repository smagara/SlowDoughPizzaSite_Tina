import React, { useState } from 'react';
import { GitBranch, KeyRound, ShieldCheck } from 'lucide-react';
import { cmsConfig, repoUrl, TOKEN_HELP_URL } from '../config';
import { Button, Card, Notice, inputClass } from './ui';

interface SignInProps {
  onSubmit: (token: string) => Promise<void>;
  error?: string;
  busy?: boolean;
}

/**
 * Production sign-in. The site is fully static (GitHub Pages) so there is no server to hold an
 * OAuth secret; staff authenticate with a GitHub fine-grained personal access token that is only
 * ever sent to api.github.com and is kept in sessionStorage (cleared when the tab closes).
 */
export const SignIn: React.FC<SignInProps> = ({ onSubmit, error, busy }) => {
  const [token, setToken] = useState('');
  const [show, setShow] = useState(false);

  return (
    <div className="max-w-xl mx-auto">
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0e7dc] text-xs font-semibold text-[#8a4224] tracking-widest uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            Staff only
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#24211e]">Sign in with GitHub</h2>
          <p className="text-sm text-[#615448] leading-relaxed">
            Only GitHub collaborators with write access to{' '}
            <a className="underline decoration-[#c85a32]/50 hover:text-[#c85a32]" href={repoUrl()} target="_blank" rel="noreferrer">
              {cmsConfig.owner}/{cmsConfig.repo}
            </a>{' '}
            can propose changes. Paste your personal access token below.
          </p>
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (token.trim()) void onSubmit(token.trim());
          }}
        >
          <label htmlFor="github-token" className="block text-xs font-semibold uppercase tracking-wider text-[#6e6052]">
            GitHub personal access token
          </label>
          <div className="flex gap-2">
            <input
              id="github-token"
              type={show ? 'text' : 'password'}
              autoComplete="off"
              spellCheck={false}
              className={inputClass(!!error)}
              placeholder="github_pat_…"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={busy}
            />
            <Button variant="ghost" size="sm" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide token' : 'Show token'}>
              {show ? 'Hide' : 'Show'}
            </Button>
          </div>
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" variant="primary" disabled={busy || !token.trim()} className="w-full sm:w-auto" id="cms-sign-in-btn">
            <KeyRound className="w-4 h-4 text-[#c85a32]" />
            {busy ? 'Checking access…' : 'Sign in'}
          </Button>
        </form>

        <div className="rounded-xl bg-[#f2ebdf] border border-[#ded3c5] p-4 text-xs text-[#5c5044] space-y-2 leading-relaxed">
          <strong className="block text-[#24211e]">Need a token?</strong>
          <ol className="list-decimal pl-4 space-y-1">
            <li>
              Open{' '}
              <a className="underline" href={TOKEN_HELP_URL} target="_blank" rel="noreferrer">
                GitHub → Settings → Developer settings → Fine-grained tokens
              </a>
              .
            </li>
            <li>
              Repository access: <em>Only select repositories</em> → {cmsConfig.repo}.
            </li>
            <li>
              Permissions: <em>Contents: Read and write</em>, <em>Pull requests: Read and write</em>.
            </li>
            <li>Copy the token and paste it above. It stays in this browser tab only.</li>
          </ol>
          <p className="pt-1 text-[#8d7e70]">
            <GitBranch className="w-3.5 h-3.5 inline-block align-text-bottom mr-1.5" />
            Every save opens a Pull Request on a <code>{cmsConfig.branchPrefix}/…</code> branch — nothing goes live until it is approved.
          </p>
        </div>
      </Card>
    </div>
  );
};
