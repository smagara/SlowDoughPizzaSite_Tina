/**
 * "Remember this device" vault for the GitHub token.
 *
 * The site is static, so there is no server session. To spare staff from pasting their GitHub
 * token on every visit, the token can be stored on the device *encrypted with a passcode they
 * choose*:
 *
 *   passcode ──PBKDF2-SHA-256 (600k iterations, random salt)──▶ AES-256-GCM key ──▶ encrypt(token)
 *
 * Only the ciphertext, salt and IV go into localStorage; the passcode is never stored and the
 * token is only ever decrypted into memory (and the tab's sessionStorage) after a correct passcode.
 * Several people can be remembered on one device (a shared shop laptop): each GitHub login has its
 * own entry and its own passcode. Five wrong passcodes wipe that person's entry, so the vault cannot
 * be brute-forced in place.
 *
 * Trade-off (documented in the TDD): a short passcode protects against casual access, not against
 * an attacker who copies localStorage and runs an offline guess. That is why the token itself is a
 * fine-grained one scoped to this single repository with a ≤90-day expiry, and why GitHub OAuth via
 * a small proxy remains the recommended long-term replacement (TDD open question Q1).
 */

export const VAULT_STORAGE_KEY = 'slowdough.cms.vault';
export const VAULT_MAX_FAILURES = 5;
export const PASSCODE_MIN_LENGTH = 6;
/** How many people can be remembered on one device (a shared shop laptop). */
export const VAULT_MAX_USERS = 8;
const PBKDF2_ITERATIONS = 600_000;

interface VaultRecord {
  login: string;
  salt: string; // base64
  iv: string; // base64
  data: string; // base64 ciphertext
  iterations: number;
  failures: number;
  createdAt: string;
  lastUsedAt: string;
}

/** One vault per browser profile, holding one encrypted token per GitHub login. */
interface VaultFile {
  v: 2;
  users: Record<string, VaultRecord>;
}

export interface RememberedUser {
  login: string;
  createdAt: string;
  lastUsedAt: string;
}

export class VaultError extends Error {
  constructor(
    message: string,
    public readonly code: 'wrong-passcode' | 'wiped' | 'unsupported' | 'missing' | 'weak-passcode',
  ) {
    super(message);
    this.name = 'VaultError';
  }
}

const enc = new TextEncoder();
const dec = new TextDecoder();
const toB64 = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

function subtle(): SubtleCrypto {
  const s = globalThis.crypto?.subtle;
  if (!s) throw new VaultError('This browser cannot store the token securely (WebCrypto unavailable).', 'unsupported');
  return s;
}

async function deriveKey(passcode: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await subtle().importKey('raw', enc.encode(passcode.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
  return subtle().deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function read(storage: Storage): VaultFile {
  try {
    const raw = storage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return { v: 2, users: {} };
    const parsed = JSON.parse(raw) as { v?: number; users?: Record<string, VaultRecord> } & Partial<VaultRecord>;
    if (parsed.v === 2 && parsed.users && typeof parsed.users === 'object') return { v: 2, users: parsed.users };
    // v1 (single user) → v2
    if (parsed.v === 1 && typeof parsed.data === 'string' && typeof parsed.login === 'string') {
      const { v: _v, ...rec } = parsed as VaultRecord & { v: number };
      return { v: 2, users: { [rec.login]: { ...rec, lastUsedAt: rec.lastUsedAt ?? rec.createdAt } } };
    }
    return { v: 2, users: {} };
  } catch {
    return { v: 2, users: {} };
  }
}

function write(storage: Storage, file: VaultFile): void {
  if (Object.keys(file.users).length === 0) storage.removeItem(VAULT_STORAGE_KEY);
  else storage.setItem(VAULT_STORAGE_KEY, JSON.stringify(file));
}

/** Validate a passcode chosen by the user. Returns an error message or undefined. */
export function validatePasscode(passcode: string, confirm?: string): string | undefined {
  if (passcode.length < PASSCODE_MIN_LENGTH) return `Use at least ${PASSCODE_MIN_LENGTH} characters.`;
  if (passcode.length > 128) return 'Passcode is too long.';
  if (/^(.)\1+$/.test(passcode) || /^(0123456789|1234567890|123456|654321|password|qwerty)/i.test(passcode)) {
    return 'That passcode is too easy to guess.';
  }
  if (confirm !== undefined && confirm !== passcode) return 'The two passcodes do not match.';
  return undefined;
}

/** Everyone remembered on this device, most recently used first. */
export function rememberedUsers(storage: Storage = window.localStorage): RememberedUser[] {
  return Object.values(read(storage).users)
    .map(({ login, createdAt, lastUsedAt }) => ({ login, createdAt, lastUsedAt }))
    .sort((a, b) => Date.parse(b.lastUsedAt) - Date.parse(a.lastUsedAt));
}

/** Convenience: the most recently used remembered user, if any. */
export function vaultInfo(storage: Storage = window.localStorage): RememberedUser | null {
  return rememberedUsers(storage)[0] ?? null;
}

/** Encrypt the token with the passcode and remember it on this device under the GitHub login. */
export async function saveToVault(token: string, passcode: string, login: string, storage: Storage = window.localStorage): Promise<void> {
  const weak = validatePasscode(passcode);
  if (weak) throw new VaultError(weak, 'weak-passcode');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passcode, salt, PBKDF2_ITERATIONS);
  const data = await subtle().encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, enc.encode(token));
  const now = new Date().toISOString();
  const file = read(storage);
  const rec: VaultRecord = {
    login,
    salt: toB64(salt),
    iv: toB64(iv),
    data: toB64(data),
    iterations: PBKDF2_ITERATIONS,
    failures: 0,
    createdAt: file.users[login]?.createdAt ?? now,
    lastUsedAt: now,
  };
  file.users[login] = rec;
  // Keep the device tidy: drop the least recently used entries beyond the cap.
  const logins = Object.values(file.users)
    .sort((a, b) => Date.parse(b.lastUsedAt) - Date.parse(a.lastUsedAt))
    .map((r) => r.login);
  for (const stale of logins.slice(VAULT_MAX_USERS)) delete file.users[stale];
  write(storage, file);
}

/**
 * Decrypt the remembered token for a login. A wrong passcode counts a failure for that login only;
 * after VAULT_MAX_FAILURES that login's entry is wiped and they must paste a token again.
 */
export async function openVault(passcode: string, login: string, storage: Storage = window.localStorage): Promise<{ token: string; login: string }> {
  const file = read(storage);
  const rec = file.users[login];
  if (!rec) throw new VaultError('No token is remembered on this device for that account.', 'missing');
  try {
    const key = await deriveKey(passcode, fromB64(rec.salt), rec.iterations);
    const plain = await subtle().decrypt({ name: 'AES-GCM', iv: fromB64(rec.iv) as BufferSource }, key, fromB64(rec.data) as BufferSource);
    file.users[login] = { ...rec, failures: 0, lastUsedAt: new Date().toISOString() };
    write(storage, file);
    return { token: dec.decode(plain), login };
  } catch (e) {
    if (e instanceof VaultError) throw e;
    const failures = rec.failures + 1;
    if (failures >= VAULT_MAX_FAILURES) {
      delete file.users[login];
      write(storage, file);
      throw new VaultError(`Wrong passcode ${failures} times — the remembered token for @${login} was erased for safety. Paste your GitHub token again to continue.`, 'wiped');
    }
    file.users[login] = { ...rec, failures };
    write(storage, file);
    const left = VAULT_MAX_FAILURES - failures;
    throw new VaultError(`Wrong passcode. ${left} attempt${left === 1 ? '' : 's'} left before the remembered token is erased.`, 'wrong-passcode');
  }
}

/** Forget one remembered person, or everyone (no login) on this device. */
export function clearVault(login?: string, storage: Storage = window.localStorage): void {
  if (!login) {
    storage.removeItem(VAULT_STORAGE_KEY);
    return;
  }
  const file = read(storage);
  delete file.users[login];
  write(storage, file);
}
