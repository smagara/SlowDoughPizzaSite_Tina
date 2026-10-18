import React, { useState } from 'react';
import { GitBranch, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { cmsConfig, repoUrl, TOKEN_HELP_URL } from '../config';
import { PASSCODE_MIN_LENGTH, validatePasscode, type RememberedUser } from '../tokenVault';
import { Button, Card, Notice, inputClass } from './ui';

export interface RememberChoice {
  passcode: string;
}

interface SignInProps {
  /** Paste-a-token sign in. `remember` is set when the user chose to keep the token on this device. */
  onSubmit: (token: string, remember?: RememberChoice) => Promise<void>;
  /** Passcode unlock of a token remembered on this device for the given login. */
  onUnlock: (login: string, passcode: string) => Promise<void>;
  /** Forget one remembered person (login) or everyone (undefined). */
  onForgetDevice: (login?: string) => void;
  /** People remembered on this device, most recently used first. */
  remembered?: RememberedUser[];
  /** Shown after an inactivity lock. */
  lockedReason?: string;
  error?: string;
  busy?: boolean;
}

/**
 * Production sign-in. The site is fully static (GitHub Pages) so there is no server to hold an
 * OAuth secret; staff authenticate with a GitHub fine-grained personal access token that is only
 * ever sent to api.github.com. Optionally the token is remembered on the device, encrypted with a
 * passcode the staff member chooses, so later visits only need the passcode.
 */
export const SignIn: React.FC<SignInProps> = ({ onSubmit, onUnlock, onForgetDevice, remembered = [], lockedReason, error, busy }) => {
  const [token, setToken] = useState('');
  const [who, setWho] = useState<string>(remembered[0]?.login ?? '');
  const current = remembered.find((r) => r.login === who) ?? remembered[0];
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [useDifferentToken, setUseDifferentToken] = useState(false);
  const passcodeError = remember && (passcode || confirm) ? validatePasscode(passcode, confirm) : undefined;
  const canSubmit = !!token.trim() && (!remember || (!!passcode && !validatePasscode(passcode, confirm)));

  // ---- Unlock with passcode -----------------------------------------------------------------------
  if (current && !useDifferentToken) {
    const several = remembered.length > 1;
    return (
      <div className="max-w-xl mx-auto">
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0e7dc] text-xs font-semibold text-[#8a4224] tracking-widest uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              Staff only
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#24211e]">{several ? 'Who is editing?' : `Welcome back, @${current.login}`}</h2>
            <p className="text-sm text-[#615448] leading-relaxed">
              {several ? 'Pick your name, then enter the passcode you chose for this device.' : 'Enter the passcode you chose for this device to unlock your GitHub access.'}
            </p>
          </div>
          {lockedReason && <Notice tone="warn">{lockedReason}</Notice>}
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (passcode) void onUnlock(current.login, passcode);
            }}
          >
            {several && (
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Remembered people on this device">
                {remembered.map((r) => (
                  <button
                    key={r.login}
                    type="button"
                    role="radio"
                    aria-checked={r.login === current.login}
                    onClick={() => {
                      setWho(r.login);
                      setPasscode('');
                    }}
                    className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                      r.login === current.login ? 'bg-[#24211e] text-[#faf8f5]' : 'bg-[#f0e8dc] text-[#54483d] hover:bg-[#e4d8cb]'
                    }`}
                  >
                    @{r.login}
                  </button>
                ))}
              </div>
            )}
            <label htmlFor="vault-passcode" className="block text-xs font-semibold uppercase tracking-wider text-[#6e6052]">
              Passcode for @{current.login}
            </label>
            <input
              id="vault-passcode"
              type="password"
              autoComplete="current-password"
              className={inputClass(!!error)}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              disabled={busy}
              autoFocus
            />
            {error && (
              <Notice tone="error">
                {error}
                {/rejected the access token/i.test(error) && (
                  <span className="block mt-1">Your remembered token has probably expired or been revoked — choose “Use a different token” and paste a fresh one.</span>
                )}
              </Notice>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="primary" disabled={busy || !passcode} id="cms-unlock-btn">
                <LockKeyhole className="w-4 h-4 text-[#c85a32]" />
                {busy ? 'Unlocking…' : 'Unlock'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setUseDifferentToken(true)} disabled={busy} id="cms-other-token-btn">
                {several ? 'Someone else / new token' : 'Use a different token'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                id="cms-forget-device-btn"
                onClick={() => {
                  if (window.confirm(`Forget the remembered token for @${current.login} on this device? They will need to paste a GitHub token next time.`)) onForgetDevice(current.login);
                }}
                disabled={busy}
              >
                Forget @{current.login}
              </Button>
              {several && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Forget everyone remembered on this device?')) onForgetDevice();
                  }}
                  disabled={busy}
                >
                  Forget everyone
                </Button>
              )}
            </div>
          </form>
          <p className="text-xs text-[#8d7e70] leading-relaxed">
            Shared computer? Each person signs in once with their own token and chooses their own passcode; after that everyone picks their name here. Sessions lock
            automatically after a period of inactivity, and <em>Sign out</em> always locks immediately.
          </p>
        </Card>
      </div>
    );
  }

  // ---- Paste a token ----------------------------------------------------------------------------
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
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) void onSubmit(token.trim(), remember ? { passcode } : undefined);
          }}
        >
          <div className="space-y-2">
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
          </div>

          <div className="rounded-xl border border-[#ded3c5] bg-[#fffdfa] p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input id="remember-device" type="checkbox" className="mt-1 h-4 w-4 accent-[#c85a32]" checked={remember} onChange={(e) => setRemember(e.target.checked)} disabled={busy} />
              <span className="text-sm text-[#3d352e]">
                <strong className="block text-[#24211e]">Remember me on this device with a passcode</strong>
                <span className="text-xs text-[#6e6052] leading-relaxed">
                  Recommended. Your token is encrypted with a passcode you choose and kept on this computer, so next time you only type the passcode instead of finding and
                  pasting the token. On a shared computer each person is remembered separately under their own GitHub name — just use a passcode nobody else at the counter
                  knows. Untick this on a computer you do not trust.
                </span>
              </span>
            </label>
            {remember && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7">
                <div className="space-y-1">
                  <label htmlFor="new-passcode" className="block text-xs font-semibold uppercase tracking-wider text-[#6e6052]">
                    Choose a passcode
                  </label>
                  <input
                    id="new-passcode"
                    type="password"
                    autoComplete="new-password"
                    className={inputClass(!!passcodeError)}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    disabled={busy}
                    placeholder={`At least ${PASSCODE_MIN_LENGTH} characters`}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="confirm-passcode" className="block text-xs font-semibold uppercase tracking-wider text-[#6e6052]">
                    Repeat passcode
                  </label>
                  <input id="confirm-passcode" type="password" autoComplete="new-password" className={inputClass(!!passcodeError)} value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={busy} />
                </div>
                {passcodeError && (
                  <p role="alert" className="sm:col-span-2 text-xs text-[#a84d2a]">
                    {passcodeError}
                  </p>
                )}
              </div>
            )}
          </div>

          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="primary" disabled={busy || !canSubmit} id="cms-sign-in-btn">
              <KeyRound className="w-4 h-4 text-[#c85a32]" />
              {busy ? 'Checking access…' : 'Sign in'}
            </Button>
            {remembered.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setUseDifferentToken(false)} disabled={busy}>
                ← Back to passcode
              </Button>
            )}
          </div>
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
            <li>Copy the token and paste it above. It is only ever sent to GitHub.</li>
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
