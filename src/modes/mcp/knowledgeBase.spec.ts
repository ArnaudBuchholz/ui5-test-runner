import { it, expect, describe, beforeEach, vi } from 'vitest';
import { FileSystem, Crypto, Path, __sourcesRoot } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { buildKnowledgeBaseIndex, deriveId } from './knowledgeBase.js';
import type { IDocument } from './knowledgeBase.js';

const NO_CONFIGURATION = {} as Configuration;
const DOCS_DIR = Path.join(__sourcesRoot, '../docs');

const dirent = (relativeFolder: string, name: string, isFile = true) =>
  ({ parentPath: Path.join(DOCS_DIR, relativeFolder), name, isFile: () => isFile }) as never;

const entityDocument = (path: string, frontmatter: string, body = 'content'): IDocument => ({
  path,
  content: `---\n${frontmatter}\n---\n${body}`
});

const MINIMAL = '"#type": concept\ntitle: Title\nsummary: a summary';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Crypto.sha256hex).mockReturnValue('0123456789abcdef');
});

describe('deriveId', () => {
  it('drops the .md extension', () => {
    expect(deriveId('options/coverage.md')).toBe('options/coverage');
  });

  it('drops a trailing /index', () => {
    expect(deriveId('browsers/index.md')).toBe('browsers');
  });

  it('preserves verbatim casing', () => {
    expect(deriveId('options/coverageSourceDir.md')).toBe('options/coverageSourceDir');
  });
});

describe('entity boundary', () => {
  it('ignores a document without frontmatter', () => {
    const index = buildKnowledgeBaseIndex([{ path: 'README.md', content: '# Readme' }]);
    expect(index.catalog).toStrictEqual([]);
  });

  it('ignores frontmatter without a #type key', () => {
    const index = buildKnowledgeBaseIndex([entityDocument('types.md', 'types:\n  - fs-entry')]);
    expect(index.catalog).toStrictEqual([]);
  });

  it('ignores an entity with an invalid #type', () => {
    const index = buildKnowledgeBaseIndex([entityDocument('x.md', '"#type": widget\ntitle: X\nsummary: y')]);
    expect(index.catalog).toStrictEqual([]);
  });

  it('ignores an entity missing a summary', () => {
    const index = buildKnowledgeBaseIndex([entityDocument('x.md', '"#type": concept\ntitle: X')]);
    expect(index.catalog).toStrictEqual([]);
  });
});

describe('id derivation', () => {
  it('derives the id from the path when absent', () => {
    const index = buildKnowledgeBaseIndex([entityDocument('options/coverage.md', MINIMAL)]);
    expect(index.catalog[0]!.id).toBe('options/coverage');
  });

  it('uses an explicit id over the derived one', () => {
    const index = buildKnowledgeBaseIndex([entityDocument('options/coverage.md', `${MINIMAL}\nid: coverage`)]);
    expect(index.catalog[0]!.id).toBe('coverage');
  });

  it('skips a document whose id duplicates an earlier one', () => {
    const index = buildKnowledgeBaseIndex([
      entityDocument('a.md', `${MINIMAL}\nid: dup\ntitle: First`),
      entityDocument('b.md', `${MINIMAL}\nid: dup\ntitle: Second`)
    ]);
    expect(index.getEntity('dup')!.title).toBe('First');
  });
});

describe('catalog', () => {
  it('omits keywords, sha, path and body from catalog entries', () => {
    const index = buildKnowledgeBaseIndex([entityDocument('a.md', `${MINIMAL}\nkeywords:\n  - k`)]);
    expect(index.catalog[0]).toStrictEqual({
      id: 'a',
      '#type': 'concept',
      title: 'Title',
      summary: 'a summary',
      relations: {}
    });
  });

  it('sorts catalog entries by id', () => {
    const index = buildKnowledgeBaseIndex([entityDocument('zebra.md', MINIMAL), entityDocument('alpha.md', MINIMAL)]);
    expect(index.catalog.map((entry) => entry.id)).toStrictEqual(['alpha', 'zebra']);
  });
});

describe('getEntity', () => {
  it('returns the full entity including body and path', () => {
    const index = buildKnowledgeBaseIndex([entityDocument('a.md', MINIMAL, '# Body')]);
    const entity = index.getEntity('a');
    expect(entity).toMatchObject({ id: 'a', path: 'a.md', body: '# Body', sha: '0123456789abcdef' });
  });

  it('returns undefined for an unknown id', () => {
    const index = buildKnowledgeBaseIndex([entityDocument('a.md', MINIMAL)]);
    expect(index.getEntity('missing')).toBeUndefined();
  });
});

describe('getReverseRelations', () => {
  it('returns the sources whose id-relation edge points at the id', () => {
    const index = buildKnowledgeBaseIndex([
      entityDocument('options/coverage.md', `${MINIMAL}\nrelations:\n  affects:\n    - modes/test`),
      entityDocument('modes/test.md', MINIMAL)
    ]);
    expect(index.getReverseRelations('modes/test')).toStrictEqual([{ id: 'options/coverage', relation: 'affects' }]);
  });

  it('excludes breaking-in edges', () => {
    const index = buildKnowledgeBaseIndex([entityDocument('a.md', `${MINIMAL}\nrelations:\n  breaking-in:\n    - v6`)]);
    expect(index.getReverseRelations('v6')).toStrictEqual([]);
  });

  it('returns an empty list for an id nothing points at', () => {
    const index = buildKnowledgeBaseIndex([entityDocument('a.md', MINIMAL)]);
    expect(index.getReverseRelations('a')).toStrictEqual([]);
  });
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
