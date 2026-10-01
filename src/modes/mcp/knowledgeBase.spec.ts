import { it, expect, describe, beforeEach, vi } from 'vitest';
import { FileSystem, Crypto, Path, __sourcesRoot } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';

const NO_CONFIGURATION = {} as Configuration;
const DOCS_DIR = Path.join(__sourcesRoot, '../docs');

const dirent = (relativeFolder: string, name: string, isFile = true) =>
  ({ parentPath: Path.join(DOCS_DIR, relativeFolder), name, isFile: () => isFile }) as never;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Crypto.sha256hex).mockReturnValue('0123456789abcdef');
});

describe('init then getIndex', () => {
  it('builds the catalog from the markdown documents under docs/', async () => {
    vi.mocked(FileSystem.readdir).mockResolvedValue([dirent('options', 'coverage.md'), dirent('', 'logo.png', false)]);
    vi.mocked(FileSystem.readFile).mockResolvedValue('---\n"#type": option\ntitle: coverage\nsummary: s\n---\nbody');
    vi.resetModules();
    const knowledgeBaseModule = await import('./knowledgeBase.js');
    const { init, getIndex } = knowledgeBaseModule;

    await init(NO_CONFIGURATION);

    expect(getIndex().catalog.map((entry) => entry.id)).toStrictEqual(['options/coverage']);
  });

  it('reads only the markdown files, skipping other entries', async () => {
    vi.mocked(FileSystem.readdir).mockResolvedValue([dirent('', 'coverage.md'), dirent('', 'logo.png', false)]);
    vi.mocked(FileSystem.readFile).mockResolvedValue('---\n"#type": concept\ntitle: t\nsummary: s\n---\n');
    vi.resetModules();
    const knowledgeBaseModule = await import('./knowledgeBase.js');
    const { init } = knowledgeBaseModule;

    await init(NO_CONFIGURATION);

    expect(FileSystem.readFile).toHaveBeenCalledTimes(1);
  });
});

describe('getIndex before init', () => {
  it('throws because the knowledge base is not initialized', async () => {
    vi.resetModules();
    const knowledgeBaseModule = await import('./knowledgeBase.js');
    const { getIndex } = knowledgeBaseModule;

    expect(() => getIndex()).toThrow('knowledge base not initialized');
  });
});
