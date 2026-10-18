import { beforeEach, describe, expect, it } from 'vitest';
import { clearVault, openVault, PASSCODE_MIN_LENGTH, rememberedUsers, saveToVault, validatePasscode, VAULT_MAX_FAILURES, VAULT_MAX_USERS, VAULT_STORAGE_KEY, vaultInfo } from './tokenVault';

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
    const rec = JSON.parse(raw).users.marco;
    expect(rec.iterations).toBeGreaterThanOrEqual(100_000);
    expect(rec.salt).not.toBe(rec.iv);
    const opened = await openVault('pizza-time-72', 'marco');
    expect(opened).toEqual({ token: TOKEN, login: 'marco' });
  });

  it('rejects wrong passcodes, counts failures and wipes after the limit', async () => {
    await saveToVault(TOKEN, 'pizza-time-72', 'marco');
    for (let i = 1; i < VAULT_MAX_FAILURES; i++) {
      await expect(openVault('nope-nope', 'marco')).rejects.toMatchObject({ code: 'wrong-passcode' });
      expect(JSON.parse(window.localStorage.getItem(VAULT_STORAGE_KEY)!).users.marco.failures).toBe(i);
    }
    await expect(openVault('nope-nope', 'marco')).rejects.toMatchObject({ code: 'wiped' });
    expect(vaultInfo()).toBeNull();
    await expect(openVault('pizza-time-72', 'marco')).rejects.toMatchObject({ code: 'missing' });
  });

  it('resets the failure counter after a successful unlock', async () => {
    await saveToVault(TOKEN, 'pizza-time-72', 'marco');
    await expect(openVault('wrong-1', 'marco')).rejects.toMatchObject({ code: 'wrong-passcode' });
    await openVault('pizza-time-72', 'marco');
    expect(JSON.parse(window.localStorage.getItem(VAULT_STORAGE_KEY)!).users.marco.failures).toBe(0);
  });

  it('uses a fresh salt and IV for every save', async () => {
    await saveToVault(TOKEN, 'pizza-time-72', 'marco');
    const a = JSON.parse(window.localStorage.getItem(VAULT_STORAGE_KEY)!).users.marco;
    await saveToVault(TOKEN, 'pizza-time-72', 'marco');
    const b = JSON.parse(window.localStorage.getItem(VAULT_STORAGE_KEY)!).users.marco;
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

  it('remembers several people on a shared device, each with their own passcode and lockout', async () => {
    await saveToVault('token-marco', 'marco-pass-1', 'marco');
    await saveToVault('token-elena', 'elena-pass-2', 'elena');
    expect(rememberedUsers().map((u) => u.login)).toEqual(['elena', 'marco']); // most recent first
    expect((await openVault('elena-pass-2', 'elena')).token).toBe('token-elena');
    expect((await openVault('marco-pass-1', 'marco')).token).toBe('token-marco');
    await expect(openVault('marco-pass-1', 'elena')).rejects.toMatchObject({ code: 'wrong-passcode' }); // passcodes are per person
    // Elena's failures (one already counted above) do not touch Marco's entry
    for (let i = 0; i < VAULT_MAX_FAILURES - 2; i++) await expect(openVault('x', 'elena')).rejects.toMatchObject({ code: 'wrong-passcode' });
    await expect(openVault('x', 'elena')).rejects.toMatchObject({ code: 'wiped' });
    expect(rememberedUsers().map((u) => u.login)).toEqual(['marco']);
    expect((await openVault('marco-pass-1', 'marco')).token).toBe('token-marco');
    // forget one person vs everyone
    await saveToVault('token-elena', 'elena-pass-2', 'elena');
    clearVault('elena');
    expect(rememberedUsers().map((u) => u.login)).toEqual(['marco']);
    clearVault();
    expect(rememberedUsers()).toEqual([]);
  });

  it('caps the number of remembered people and migrates the v1 single-user format', async () => {
    for (let i = 0; i < VAULT_MAX_USERS + 2; i++) await saveToVault(`t${i}`, 'pizza-time-72', `user${i}`);
    expect(rememberedUsers()).toHaveLength(VAULT_MAX_USERS);
    expect(rememberedUsers().map((u) => u.login)).not.toContain('user0');
    // v1 record written by the previous release
    await saveToVault(TOKEN, 'pizza-time-72', 'marco');
    const v2 = JSON.parse(window.localStorage.getItem(VAULT_STORAGE_KEY)!);
    const v1 = { v: 1, ...v2.users.marco };
    delete v1.lastUsedAt;
    window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(v1));
    expect(rememberedUsers().map((u) => u.login)).toEqual(['marco']);
    expect((await openVault('pizza-time-72', 'marco')).token).toBe(TOKEN);
  });
});
