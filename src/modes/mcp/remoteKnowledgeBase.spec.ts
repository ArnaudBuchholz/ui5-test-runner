import { it, expect, describe, beforeEach, vi } from 'vitest';
import { FileSystem, Http, logger } from '../../platform/index.js';

const CACHE_PATH = '/tmp/ui5-test-runner-mcp-kb-cache.json';

const treeResponse = (treeSha: string, files: { path: string; sha: string }[]) =>
  JSON.stringify({
    sha: treeSha,
    tree: [
      ...files.map((f) => ({ path: `docs/${f.path}`, type: 'blob', sha: f.sha })),
      { path: 'docs/logo.png', type: 'blob', sha: 'img-sha' },
      { path: 'docs/adr/0001-something.md', type: 'blob', sha: 'adr-sha' },
      { path: 'docs/decks/intro.md', type: 'blob', sha: 'deck-sha' },
      { path: 'docs/prompts/query.md', type: 'blob', sha: 'prompt-sha' },
      { path: 'src/index.ts', type: 'blob', sha: 'src-sha' }
    ]
  });

const cacheJson = (treeSha: string, checkedAt: number, files: Record<string, string>) =>
  JSON.stringify({ treeSha, checkedAt, files });

const NOW = 1_000_000_000_000;
const ONE_HOUR_MS = 60 * 60 * 1000;

beforeEach(() => {
  vi.clearAllMocks();
  vi.setSystemTime(NOW);
});

describe('no local cache', () => {
  it('fetches the tree and all markdown files on first run', async () => {
    vi.mocked(FileSystem.readFile).mockRejectedValue(new Error('no cache'));
    vi.mocked(Http.getAsText)
      .mockResolvedValueOnce(treeResponse('sha-1', [{ path: 'options/coverage.md', sha: 'file-sha-1' }]))
      .mockResolvedValueOnce('---\n"#type": option\ntitle: coverage\nsummary: s\n---\nbody');
    vi.resetModules();
    const { collectRemoteDocuments: collect } = await import('./remoteKnowledgeBase.js');

    const documents = await collect();

    expect(documents).toStrictEqual([
      { path: 'options/coverage.md', content: '---\n"#type": option\ntitle: coverage\nsummary: s\n---\nbody' }
    ]);
  });

  it('saves a cache file after fetching', async () => {
    vi.mocked(FileSystem.readFile).mockRejectedValue(new Error('no cache'));
    vi.mocked(Http.getAsText)
      .mockResolvedValueOnce(treeResponse('sha-1', [{ path: 'options/coverage.md', sha: 'file-sha-1' }]))
      .mockResolvedValueOnce('content');
    vi.resetModules();
    const { collectRemoteDocuments: collect } = await import('./remoteKnowledgeBase.js');

    await collect();

    expect(FileSystem.writeFileSync).toHaveBeenCalledWith(
      CACHE_PATH,
      cacheJson('sha-1', NOW, { 'options/coverage.md': 'file-sha-1' })
    );
  });

  it('excludes adr, decks and prompts folders', async () => {
    vi.mocked(FileSystem.readFile).mockRejectedValue(new Error('no cache'));
    vi.mocked(Http.getAsText)
      .mockResolvedValueOnce(treeResponse('sha-1', [{ path: 'options/coverage.md', sha: 'file-sha-1' }]))
      .mockResolvedValue('content');
    vi.resetModules();
    const { collectRemoteDocuments: collect } = await import('./remoteKnowledgeBase.js');

    const documents = await collect();

    expect(documents.map((document) => document.path)).toStrictEqual(['options/coverage.md']);
  });

  it('throws when GitHub is unreachable and there is no cache', async () => {
    vi.mocked(FileSystem.readFile).mockRejectedValue(new Error('no cache'));
    vi.mocked(Http.getAsText).mockRejectedValue(new Error('network error'));
    vi.resetModules();
    const { collectRemoteDocuments: collect } = await import('./remoteKnowledgeBase.js');

    await expect(collect()).rejects.toThrow('Failed to fetch knowledge base from GitHub');
  });
});

describe('cache within 1-hour window', () => {
  it('returns documents from cache without calling GitHub', async () => {
    const recentCache = cacheJson('sha-1', NOW - ONE_HOUR_MS + 1, { 'options/coverage.md': 'file-sha-1' });
    vi.mocked(FileSystem.readFile).mockResolvedValue(recentCache);
    vi.mocked(Http.getAsText).mockResolvedValue('content');
    vi.resetModules();
    const { collectRemoteDocuments: collect } = await import('./remoteKnowledgeBase.js');

    await collect();

    expect(Http.getAsText).toHaveBeenCalledTimes(1); // only the file content (missing from memory cache)
  });

  it('fetches file content not yet in memory', async () => {
    const recentCache = cacheJson('sha-1', NOW - ONE_HOUR_MS + 1, { 'options/coverage.md': 'file-sha-1' });
    vi.mocked(FileSystem.readFile).mockResolvedValue(recentCache);
    vi.mocked(Http.getAsText).mockResolvedValue('the content');
    vi.resetModules();
    const { collectRemoteDocuments: collect } = await import('./remoteKnowledgeBase.js');

    const documents = await collect();

    expect(documents).toStrictEqual([{ path: 'options/coverage.md', content: 'the content' }]);
  });
});

describe('cache older than 1 hour, SHA unchanged', () => {
  it('refreshes the timestamp but does not refetch files', async () => {
    const oldCache = cacheJson('sha-1', NOW - ONE_HOUR_MS, { 'options/coverage.md': 'file-sha-1' });
    vi.mocked(FileSystem.readFile).mockResolvedValue(oldCache);
    vi.mocked(Http.getAsText)
      .mockResolvedValueOnce(treeResponse('sha-1', [{ path: 'options/coverage.md', sha: 'file-sha-1' }]))
      .mockResolvedValue('content');
    vi.resetModules();
    const { collectRemoteDocuments: collect } = await import('./remoteKnowledgeBase.js');

    await collect();

    expect(FileSystem.writeFileSync).toHaveBeenCalledWith(
      CACHE_PATH,
      cacheJson('sha-1', NOW, { 'options/coverage.md': 'file-sha-1' })
    );
    expect(Http.getAsText).toHaveBeenCalledTimes(2); // tree check + missing content
  });
});

describe('cache older than 1 hour, SHA changed', () => {
  it('fetches only changed files when memory cache is warm', async () => {
    // First call: populate memory cache for parallel.md
    vi.mocked(FileSystem.readFile).mockRejectedValue(new Error('no cache'));
    vi.mocked(Http.getAsText)
      .mockResolvedValueOnce(
        treeResponse('sha-old', [
          { path: 'options/coverage.md', sha: 'file-sha-old' },
          { path: 'options/parallel.md', sha: 'file-sha-2' }
        ])
      )
      .mockResolvedValue('content');
    vi.resetModules();
    const { collectRemoteDocuments: collect } = await import('./remoteKnowledgeBase.js');
    await collect();

    // Second call: SHA changed, parallel.md has same SHA but is already in memory
    vi.mocked(FileSystem.readFile).mockResolvedValue(
      cacheJson('sha-old', NOW - ONE_HOUR_MS, {
        'options/coverage.md': 'file-sha-old',
        'options/parallel.md': 'file-sha-2'
      })
    );
    vi.clearAllMocks();
    vi.mocked(Http.getAsText)
      .mockResolvedValueOnce(
        treeResponse('sha-new', [
          { path: 'options/coverage.md', sha: 'file-sha-new' },
          { path: 'options/parallel.md', sha: 'file-sha-2' }
        ])
      )
      .mockResolvedValue('updated content');

    await collect();

    const calls = vi.mocked(Http.getAsText).mock.calls.map(([url]) => url);
    const fileFetches = calls.filter((url) => url.includes('raw.githubusercontent.com'));
    expect(fileFetches).toHaveLength(1);
    expect(fileFetches[0]).toContain('coverage.md');
  });

  it('evicts removed files from the cache', async () => {
    const oldCache = cacheJson('sha-old', NOW - ONE_HOUR_MS, {
      'options/coverage.md': 'file-sha-1',
      'options/removed.md': 'file-sha-r'
    });
    vi.mocked(FileSystem.readFile).mockResolvedValue(oldCache);
    vi.mocked(Http.getAsText)
      .mockResolvedValueOnce(treeResponse('sha-new', [{ path: 'options/coverage.md', sha: 'file-sha-1' }]))
      .mockResolvedValue('content');
    vi.resetModules();
    const { collectRemoteDocuments: collect } = await import('./remoteKnowledgeBase.js');

    const documents = await collect();

    expect(documents.map((document) => document.path)).toStrictEqual(['options/coverage.md']);
  });

  it('saves updated cache with new tree SHA', async () => {
    const oldCache = cacheJson('sha-old', NOW - ONE_HOUR_MS, { 'options/coverage.md': 'file-sha-old' });
    vi.mocked(FileSystem.readFile).mockResolvedValue(oldCache);
    vi.mocked(Http.getAsText)
      .mockResolvedValueOnce(treeResponse('sha-new', [{ path: 'options/coverage.md', sha: 'file-sha-new' }]))
      .mockResolvedValue('content');
    vi.resetModules();
    const { collectRemoteDocuments: collect } = await import('./remoteKnowledgeBase.js');

    await collect();

    expect(FileSystem.writeFileSync).toHaveBeenCalledWith(
      CACHE_PATH,
      cacheJson('sha-new', NOW, { 'options/coverage.md': 'file-sha-new' })
    );
  });
});

describe('GitHub unreachable with existing cache', () => {
  it('warns and falls back to cached documents', async () => {
    const oldCache = cacheJson('sha-1', NOW - ONE_HOUR_MS, { 'options/coverage.md': 'file-sha-1' });
    vi.mocked(FileSystem.readFile).mockResolvedValue(oldCache);
    vi.mocked(Http.getAsText).mockRejectedValueOnce(new Error('network error')).mockResolvedValue('content');
    vi.resetModules();
    const { collectRemoteDocuments: collect } = await import('./remoteKnowledgeBase.js');

    const documents = await collect();

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'mcp', message: expect.stringContaining('cached') as string })
    );
    expect(documents.map((document) => document.path)).toStrictEqual(['options/coverage.md']);
  });
});

describe('memory cache', () => {
  it('does not re-fetch content already in memory on a second call within 1 hour', async () => {
    vi.mocked(FileSystem.readFile).mockRejectedValue(new Error('no cache'));
    vi.mocked(Http.getAsText)
      .mockResolvedValueOnce(treeResponse('sha-1', [{ path: 'a.md', sha: 'sha-a' }]))
      .mockResolvedValue('content');
    vi.resetModules();
    const { collectRemoteDocuments: collect } = await import('./remoteKnowledgeBase.js');

    await collect();
    vi.mocked(FileSystem.readFile).mockResolvedValue(cacheJson('sha-1', NOW, { 'a.md': 'sha-a' }));
    vi.clearAllMocks();

    await collect();

    expect(Http.getAsText).not.toHaveBeenCalled(); // content still in memory
  });
});
