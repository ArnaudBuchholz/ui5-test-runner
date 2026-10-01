import { it, expect, describe, beforeEach, vi } from 'vitest';
import { Crypto } from '../../platform/index.js';
import { buildKnowledgeBaseIndex, deriveId } from './kbIndex.js';
import type { IDocument } from './kbIndex.js';

const entityDocument = (path: string, frontmatter: string, body = 'content'): IDocument => ({
  path,
  content: `---\n${frontmatter}\n---\n${body}`
});

const MINIMAL = '"#type": concept\ntitle: Title\nsummary: a summary';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Crypto.sha256hex).mockReturnValue('0123456789abcdef0000');
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
