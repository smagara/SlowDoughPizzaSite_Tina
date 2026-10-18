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
 * Five wrong passcodes wipe the vault, so a shared shop laptop cannot be brute-forced in place.
 *
 * Trade-off (documented in the TDD): a short passcode protects against casual access, not against
 * an attacker who copies localStorage and runs an offline guess. That is why the token itself is a
 * fine-grained one scoped to this single repository with a ≤90-day expiry, and why GitHub OAuth via
 * a small proxy remains the recommended long-term replacement (TDD open question Q1).
 */

export const VAULT_STORAGE_KEY = 'slowdough.cms.vault';
export const VAULT_MAX_FAILURES = 5;
export const PASSCODE_MIN_LENGTH = 6;
const PBKDF2_ITERATIONS = 600_000;

interface VaultRecord {
  v: 1;
  login: string;
  salt: string; // base64
  iv: string; // base64
  data: string; // base64 ciphertext
  iterations: number;
  failures: number;
  createdAt: string;
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

function read(storage: Storage): VaultRecord | null {
  try {
    const raw = storage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw) as VaultRecord;
    return rec && rec.v === 1 && typeof rec.data === 'string' ? rec : null;
  } catch {
    return null;
  }
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

/** Is a remembered token present on this device? Returns the GitHub login it belongs to. */
export function vaultInfo(storage: Storage = window.localStorage): { login: string; createdAt: string } | null {
  const rec = read(storage);
  return rec ? { login: rec.login, createdAt: rec.createdAt } : null;
}

/** Encrypt the token with the passcode and remember it on this device. */
export async function saveToVault(token: string, passcode: string, login: string, storage: Storage = window.localStorage): Promise<void> {
  const weak = validatePasscode(passcode);
  if (weak) throw new VaultError(weak, 'weak-passcode');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passcode, salt, PBKDF2_ITERATIONS);
  const data = await subtle().encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, enc.encode(token));
  const rec: VaultRecord = {
    v: 1,
    login,
    salt: toB64(salt),
    iv: toB64(iv),
    data: toB64(data),
    iterations: PBKDF2_ITERATIONS,
    failures: 0,
    createdAt: new Date().toISOString(),
  };
  storage.setItem(VAULT_STORAGE_KEY, JSON.stringify(rec));
}

/**
 * Decrypt the remembered token. A wrong passcode counts a failure; after VAULT_MAX_FAILURES the
 * vault is wiped and the user must paste a token again.
 */
export async function openVault(passcode: string, storage: Storage = window.localStorage): Promise<{ token: string; login: string }> {
  const rec = read(storage);
  if (!rec) throw new VaultError('No token is remembered on this device.', 'missing');
  try {
    const key = await deriveKey(passcode, fromB64(rec.salt), rec.iterations);
    const plain = await subtle().decrypt({ name: 'AES-GCM', iv: fromB64(rec.iv) as BufferSource }, key, fromB64(rec.data) as BufferSource);
    if (rec.failures) storage.setItem(VAULT_STORAGE_KEY, JSON.stringify({ ...rec, failures: 0 }));
    return { token: dec.decode(plain), login: rec.login };
  } catch (e) {
    if (e instanceof VaultError) throw e;
    const failures = rec.failures + 1;
    if (failures >= VAULT_MAX_FAILURES) {
      storage.removeItem(VAULT_STORAGE_KEY);
      throw new VaultError(`Wrong passcode ${failures} times — the remembered token was erased for safety. Paste your GitHub token again to continue.`, 'wiped');
    }
    storage.setItem(VAULT_STORAGE_KEY, JSON.stringify({ ...rec, failures }));
    throw new VaultError(`Wrong passcode. ${VAULT_MAX_FAILURES - failures} attempt${VAULT_MAX_FAILURES - failures === 1 ? '' : 's'} left before the remembered token is erased.`, 'wrong-passcode');
  }
}

/** Forget the remembered token on this device. */
export function clearVault(storage: Storage = window.localStorage): void {
  storage.removeItem(VAULT_STORAGE_KEY);
}
