import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileSystem, Crypto, Path } from '../../../platform/index.js';

const HASH_OPTIONS = 'abcdef';
const HASH_OPTIONS_TYPES = 'bbbbbb';
const HASH_ROOT = 'cccccc';

const DEFAULT_FOLDERS: Record<string, string[]> = { '.': [] };
const DEFAULT_HASH_MAP: Record<string, string> = { '': HASH_ROOT };

const setupHashMocks = async (
  folders: Record<string, string[]> = DEFAULT_FOLDERS,
  hashMap: Record<string, string> = DEFAULT_HASH_MAP
) => {
  vi.resetModules();
  const knowledgeBase = await import('../knowledgeBase.js');
  vi.spyOn(knowledgeBase, 'getRoot').mockReturnValue('/kb');
  vi.spyOn(knowledgeBase, 'readdir').mockImplementation((directory) =>
    Promise.resolve(folders[directory === '.' ? '.' : directory] ?? [])
  );
  vi.mocked(FileSystem.stat).mockImplementation((p) => {
    const pathString = String(p);
    const allSubFolders = Object.keys(folders).flatMap((parent) =>
      (folders[parent] ?? []).map((child) => (parent === '.' ? child : `${parent}/${child}`))
    );
    const isDirectory = allSubFolders.some((f) => pathString.endsWith(`/${f}`) || pathString === `/kb/${f}`);
    return Promise.resolve({ isDirectory: () => isDirectory } as never);
  });
  vi.mocked(Crypto.sha256hex).mockImplementation((input) => {
    const known = hashMap[input];
    return known === undefined ? `${input}_hash_xxxx` : `${known}xxxx`;
  });
};

describe('get_topic link rewriting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appends folder hash to relative .md links', async () => {
    await setupHashMocks();
    vi.mocked(FileSystem.readFile).mockResolvedValue('See [options](./options.md) for more');
    const { toolDefinitionGetTopic } = await import('./getTopic.js');
    const result = await toolDefinitionGetTopic.handler({ topic: 'installation' });
    expect(result).toContain(`./options.md?${HASH_ROOT}`);
  });

  it('does not rewrite absolute URL links', async () => {
    await setupHashMocks();
    vi.mocked(FileSystem.readFile).mockResolvedValue('[site](https://example.com)');
    const { toolDefinitionGetTopic } = await import('./getTopic.js');
    const result = await toolDefinitionGetTopic.handler({ topic: 'installation' });
    expect(result).toContain('(https://example.com)');
    expect(result).not.toContain(`?${HASH_ROOT}`);
  });

  it('does not rewrite anchor-only links', async () => {
    await setupHashMocks();
    vi.mocked(FileSystem.readFile).mockResolvedValue('[section](#my-section)');
    const { toolDefinitionGetTopic } = await import('./getTopic.js');
    const result = await toolDefinitionGetTopic.handler({ topic: 'installation' });
    expect(result).toContain('(#my-section)');
    expect(result).not.toContain(`?${HASH_ROOT}`);
  });

  it('preserves #anchor when appending hash', async () => {
    await setupHashMocks();
    vi.mocked(FileSystem.readFile).mockResolvedValue('[ref](./page.md#section)');
    const { toolDefinitionGetTopic } = await import('./getTopic.js');
    const result = await toolDefinitionGetTopic.handler({ topic: 'installation' });
    expect(result).toContain(`./page.md?${HASH_ROOT}#section`);
  });

  it('does not double-rewrite links that already have a query', async () => {
    await setupHashMocks();
    vi.mocked(FileSystem.readFile).mockResolvedValue('[ref](./page.md?existing)');
    const { toolDefinitionGetTopic } = await import('./getTopic.js');
    const result = await toolDefinitionGetTopic.handler({ topic: 'installation' });
    expect(result).toContain('./page.md?existing');
    expect(result).not.toContain(`?${HASH_ROOT}`);
  });

  it('uses subfolder hash when serving a doc in a subdirectory', async () => {
    await setupHashMocks({ '.': ['options'], options: [] }, { '': HASH_ROOT, options: HASH_OPTIONS });
    vi.mocked(FileSystem.readFile).mockResolvedValue('See [failFast](./failFast.md)');
    const { toolDefinitionGetTopic } = await import('./getTopic.js');
    const result = await toolDefinitionGetTopic.handler({ topic: 'options/webapp' });
    expect(result).toContain(`./failFast.md?${HASH_OPTIONS}`);
  });
});

describe('get_topic hash-based resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(FileSystem.readFile).mockResolvedValue('content');
  });

  it('resolves topic with hash to correct file', async () => {
    await setupHashMocks({ '.': ['options'], options: [] }, { '': HASH_ROOT, options: HASH_OPTIONS });
    const { toolDefinitionGetTopic } = await import('./getTopic.js');
    await toolDefinitionGetTopic.handler({ topic: `./webapp.md?${HASH_OPTIONS}` });
    expect(FileSystem.readFile).toHaveBeenCalledWith(
      expect.stringContaining(`options${Path.join('/', 'webapp.md')}`),
      'utf8'
    );
  });

  it('resolves relative path traversing up to parent directory', async () => {
    await setupHashMocks(
      { '.': ['options'], options: ['types'] },
      { '': HASH_ROOT, options: HASH_OPTIONS, 'options/types': HASH_OPTIONS_TYPES }
    );
    const { toolDefinitionGetTopic } = await import('./getTopic.js');
    await toolDefinitionGetTopic.handler({ topic: `../failFast.md?${HASH_OPTIONS_TYPES}` });
    expect(FileSystem.readFile).toHaveBeenCalledWith(
      expect.stringContaining(`options${Path.join('/', 'failFast.md')}`),
      'utf8'
    );
  });

  it('returns not found for unknown hash', async () => {
    await setupHashMocks({ '.': [] }, { '': HASH_ROOT });
    const { toolDefinitionGetTopic } = await import('./getTopic.js');
    const result = await toolDefinitionGetTopic.handler({ topic: './webapp.md?zzz999' });
    expect(result).toContain('not found');
  });

  it('returns not found when path escapes KB root', async () => {
    await setupHashMocks({ '.': ['options'] }, { '': HASH_ROOT, options: HASH_OPTIONS });
    const { toolDefinitionGetTopic } = await import('./getTopic.js');
    const result = await toolDefinitionGetTopic.handler({ topic: `../../../etc/passwd?${HASH_OPTIONS}` });
    expect(result).toContain('not found');
  });

  it('strips #anchor before file resolution', async () => {
    await setupHashMocks({ '.': ['options'] }, { '': HASH_ROOT, options: HASH_OPTIONS });
    const { toolDefinitionGetTopic } = await import('./getTopic.js');
    await toolDefinitionGetTopic.handler({ topic: `./webapp.md?${HASH_OPTIONS}#section` });
    expect(FileSystem.readFile).toHaveBeenCalledWith(
      expect.stringContaining(`options${Path.join('/', 'webapp.md')}`),
      'utf8'
    );
  });

  it('uses legacy path for bare topic without hash', async () => {
    await setupHashMocks({ '.': [] }, { '': HASH_ROOT });
    const { toolDefinitionGetTopic } = await import('./getTopic.js');
    await toolDefinitionGetTopic.handler({ topic: 'options' });
    expect(FileSystem.readFile).toHaveBeenCalledWith(expect.stringContaining('options.md'), 'utf8');
  });
});
