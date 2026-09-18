import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileSystem, Crypto } from '../../platform/index.js';

const getKbMocks = async () => {
  const knowledgeBase = await import('./knowledgeBase.js');
  const getRoot = vi.spyOn(knowledgeBase, 'getRoot').mockReturnValue('/kb');
  const readdir = vi.spyOn(knowledgeBase, 'readdir').mockResolvedValue([]);
  return { getRoot, readdir };
};

describe('hashFolder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Crypto.sha256hex).mockReturnValue('aaa111bbb222ccc333');
  });

  it('returns first 6 hex chars of sha256 of normalized path', async () => {
    const { hashFolder } = await import('./folderHash.js');
    const result = hashFolder('options');
    expect(Crypto.sha256hex).toHaveBeenCalledWith('options');
    expect(result).toBe('aaa111');
  });

  it('normalizes trailing slash', async () => {
    const { hashFolder } = await import('./folderHash.js');
    hashFolder('options/');
    expect(Crypto.sha256hex).toHaveBeenCalledWith('options');
  });

  it('normalizes leading ./', async () => {
    const { hashFolder } = await import('./folderHash.js');
    hashFolder('./options');
    expect(Crypto.sha256hex).toHaveBeenCalledWith('options');
  });

  it('normalizes . to empty string for root', async () => {
    const { hashFolder } = await import('./folderHash.js');
    hashFolder('.');
    expect(Crypto.sha256hex).toHaveBeenCalledWith('');
  });

  it('normalizes empty string to empty string', async () => {
    const { hashFolder } = await import('./folderHash.js');
    hashFolder('');
    expect(Crypto.sha256hex).toHaveBeenCalledWith('');
  });
});

describe('getReverseIndex', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Crypto.sha256hex).mockImplementation((input) => `sha_${input}`);
    vi.mocked(FileSystem.stat).mockResolvedValue({ isDirectory: () => false } as never);
  });

  it('maps root hash to empty string', async () => {
    vi.resetModules();
    const { readdir } = await getKbMocks();
    readdir.mockResolvedValue([]);
    const { getReverseIndex } = await import('./folderHash.js');
    const index = await getReverseIndex();
    expect(index.values().toArray()).toContain('');
  });

  it('recurses into subdirectories and maps their hashes', async () => {
    vi.resetModules();
    const { readdir } = await getKbMocks();
    readdir.mockImplementation((directory) => Promise.resolve(directory === '.' ? ['options'] : []));
    vi.mocked(FileSystem.stat).mockImplementation((p) =>
      Promise.resolve({ isDirectory: () => String(p).endsWith('options') } as never)
    );
    const { getReverseIndex, hashFolder } = await import('./folderHash.js');
    const index = await getReverseIndex();
    expect(index.get(hashFolder('options'))).toBe('options');
    expect(index.get(hashFolder(''))).toBe('');
  });

  it('throws on hash collision between two folders', async () => {
    vi.resetModules();
    const { readdir } = await getKbMocks();
    readdir.mockImplementation((directory) => Promise.resolve(directory === '.' ? ['a', 'b'] : []));
    vi.mocked(FileSystem.stat).mockResolvedValue({ isDirectory: () => true } as never);
    vi.mocked(Crypto.sha256hex).mockReturnValue('same_hash_collide');
    const { getReverseIndex } = await import('./folderHash.js');
    await expect(getReverseIndex()).rejects.toThrow('Hash collision');
  });
});
