import { beforeEach, describe, expect, it } from 'vitest';
import { clearVault, openVault, PASSCODE_MIN_LENGTH, saveToVault, validatePasscode, VAULT_MAX_FAILURES, VAULT_STORAGE_KEY, vaultInfo } from './tokenVault';

const TOKEN = 'github_pat_11AAAA_secretvalue';

describe('tokenVault', () => {
  beforeEach(() => window.localStorage.clear());

  it('round-trips a token through passcode encryption and never stores it in clear', async () => {
    expect(vaultInfo()).toBeNull();
    await saveToVault(TOKEN, 'pizza-time-72', 'marco');
    expect(vaultInfo()).toMatchObject({ login: 'marco' });
    const raw = window.localStorage.getItem(VAULT_STORAGE_KEY)!;
    expect(raw).not.toContain(TOKEN);
    expect(raw).not.toContain('pizza-time-72');
    const rec = JSON.parse(raw);
    expect(rec.iterations).toBeGreaterThanOrEqual(100_000);
    expect(rec.salt).not.toBe(rec.iv);
    const opened = await openVault('pizza-time-72');
    expect(opened).toEqual({ token: TOKEN, login: 'marco' });
  });

  it('rejects wrong passcodes, counts failures and wipes after the limit', async () => {
    await saveToVault(TOKEN, 'pizza-time-72', 'marco');
    for (let i = 1; i < VAULT_MAX_FAILURES; i++) {
      await expect(openVault('nope-nope')).rejects.toMatchObject({ code: 'wrong-passcode' });
      expect(JSON.parse(window.localStorage.getItem(VAULT_STORAGE_KEY)!).failures).toBe(i);
    }
    await expect(openVault('nope-nope')).rejects.toMatchObject({ code: 'wiped' });
    expect(vaultInfo()).toBeNull();
    await expect(openVault('pizza-time-72')).rejects.toMatchObject({ code: 'missing' });
  });

  it('resets the failure counter after a successful unlock', async () => {
    await saveToVault(TOKEN, 'pizza-time-72', 'marco');
    await expect(openVault('wrong-1')).rejects.toMatchObject({ code: 'wrong-passcode' });
    await openVault('pizza-time-72');
    expect(JSON.parse(window.localStorage.getItem(VAULT_STORAGE_KEY)!).failures).toBe(0);
  });

  it('uses a fresh salt and IV for every save', async () => {
    await saveToVault(TOKEN, 'pizza-time-72', 'marco');
    const a = JSON.parse(window.localStorage.getItem(VAULT_STORAGE_KEY)!);
    await saveToVault(TOKEN, 'pizza-time-72', 'marco');
    const b = JSON.parse(window.localStorage.getItem(VAULT_STORAGE_KEY)!);
    expect(a.salt).not.toBe(b.salt);
    expect(a.iv).not.toBe(b.iv);
    expect(a.data).not.toBe(b.data);
  });

  it('refuses weak passcodes and clears on demand', async () => {
    expect(validatePasscode('abc')).toMatch(new RegExp(`${PASSCODE_MIN_LENGTH} characters`));
    expect(validatePasscode('111111')).toMatch(/easy to guess/);
    expect(validatePasscode('123456')).toMatch(/easy to guess/);
    expect(validatePasscode('password1')).toMatch(/easy to guess/);
    expect(validatePasscode('pizza-time', 'pizza-tim')).toMatch(/do not match/);
    expect(validatePasscode('pizza-time', 'pizza-time')).toBeUndefined();
    await expect(saveToVault(TOKEN, 'abc', 'marco')).rejects.toMatchObject({ code: 'weak-passcode' });
    await saveToVault(TOKEN, 'pizza-time-72', 'marco');
    clearVault();
    expect(vaultInfo()).toBeNull();
  });
});
