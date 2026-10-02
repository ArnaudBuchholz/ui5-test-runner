import { it, expect, vi } from 'vitest';
import type { Crypto as CryptoType } from './Crypto.js';
const { Crypto } = await vi.importActual<{ Crypto: typeof CryptoType }>('./Crypto.js');

it('hashes input to a 64-character hex sha-256 digest', () => {
  expect(Crypto.sha256hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

it('generates a UUID', () => {
  expect(Crypto.randomUUID()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
});
