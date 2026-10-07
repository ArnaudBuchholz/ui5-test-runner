import { it, expect, describe } from 'vitest';
import { parseFrontmatter } from './frontmatter.js';

describe('when there is no frontmatter block', () => {
  it('returns null frontmatter and the content as body', () => {
    expect(parseFrontmatter('# Title\njust markdown')).toStrictEqual({
      frontmatter: null,
      body: '# Title\njust markdown'
    });
  });
});

describe('scalar fields', () => {
  it('parses a quoted "#type" key', () => {
    const { frontmatter } = parseFrontmatter('---\n"#type": option\n---\n');
    expect(frontmatter?.['#type']).toBe('option');
  });

  it('parses an unquoted title', () => {
    const { frontmatter } = parseFrontmatter('---\n"#type": mode\ntitle: Batch mode\n---\n');
    expect(frontmatter?.title).toBe('Batch mode');
  });

  it('parses a double-quoted summary containing a colon', () => {
    const { frontmatter } = parseFrontmatter('---\nsummary: "Overview: what it is"\n---\n');
    expect(frontmatter?.summary).toBe('Overview: what it is');
  });

  it('parses an explicit id', () => {
    const { frontmatter } = parseFrontmatter('---\nid: coverage\n---\n');
    expect(frontmatter?.id).toBe('coverage');
  });
});

describe('keywords', () => {
  it('parses a block list', () => {
    const { frontmatter } = parseFrontmatter('---\nkeywords:\n  - coverage\n  - nyc\n---\n');
    expect(frontmatter?.keywords).toStrictEqual(['coverage', 'nyc']);
  });

  it('parses an inline-flow list', () => {
    const { frontmatter } = parseFrontmatter('---\nkeywords: [coverage, nyc, istanbul]\n---\n');
    expect(frontmatter?.keywords).toStrictEqual(['coverage', 'nyc', 'istanbul']);
  });

  it('parses an empty inline list', () => {
    const { frontmatter } = parseFrontmatter('---\nkeywords: []\n---\n');
    expect(frontmatter?.keywords).toStrictEqual([]);
  });
});

describe('relations', () => {
  it('parses a nested mapping with block-list values', () => {
    const { frontmatter } = parseFrontmatter(
      '---\nrelations:\n  affects:\n    - modes/legacy\n  see-also:\n    - options/webapp\n---\n'
    );
    expect(frontmatter?.relations).toStrictEqual({
      affects: ['modes/legacy'],
      'see-also': ['options/webapp']
    });
  });

  it('parses a nested mapping with inline-flow values', () => {
    const { frontmatter } = parseFrontmatter('---\nrelations:\n  affects: [modes/test]\n---\n');
    expect(frontmatter?.relations).toStrictEqual({ affects: ['modes/test'] });
  });

  it('parses breaking-in version tokens as a string list', () => {
    const { frontmatter } = parseFrontmatter('---\nrelations:\n  breaking-in:\n    - v6\n---\n');
    expect(frontmatter?.relations).toStrictEqual({ 'breaking-in': ['v6'] });
  });
});

describe('unmodeled shapes', () => {
  it('ignores option-only scalar keys without error', () => {
    const { frontmatter } = parseFrontmatter('---\n"#type": option\ntype: boolean\ndefault: "false"\n---\n');
    expect(frontmatter).toStrictEqual({ '#type': 'option' });
  });

  it('skips a nested validation list-of-mappings without consuming later keys', () => {
    const { frontmatter } = parseFrontmatter(
      '---\n"#type": option\nvalidation:\n  - message: "needs webapp"\n    conditions:\n      - "!coverage"\nkeywords:\n  - coverage\n---\n'
    );
    expect(frontmatter).toStrictEqual({ '#type': 'option', keywords: ['coverage'] });
  });
});

describe('tolerant formatting', () => {
  it('skips blank lines between frontmatter entries', () => {
    const { frontmatter } = parseFrontmatter('---\n"#type": option\n\ntitle: coverage\n---\n');
    expect(frontmatter).toStrictEqual({ '#type': 'option', title: 'coverage' });
  });

  it('skips a top-level line without a colon', () => {
    const { frontmatter } = parseFrontmatter('---\nnonsense\ntitle: coverage\n---\n');
    expect(frontmatter).toStrictEqual({ title: 'coverage' });
  });

  it('skips blank lines within a block list', () => {
    const { frontmatter } = parseFrontmatter('---\nkeywords:\n  - coverage\n\n  - nyc\n---\n');
    expect(frontmatter?.keywords).toStrictEqual(['coverage', 'nyc']);
  });

  it('skips blank lines and non-mapping lines within relations', () => {
    const { frontmatter } = parseFrontmatter('---\nrelations:\n\n  affects:\n    - modes/legacy\n  - stray\n---\n');
    expect(frontmatter?.relations).toStrictEqual({ affects: ['modes/legacy'] });
  });

  it('ends the relations block at the next top-level key', () => {
    const { frontmatter } = parseFrontmatter('---\nrelations:\n  affects:\n    - modes/legacy\ntitle: coverage\n---\n');
    expect(frontmatter).toStrictEqual({ relations: { affects: ['modes/legacy'] }, title: 'coverage' });
  });

  it('ignores a keywords value that is neither a block nor an inline list', () => {
    const { frontmatter } = parseFrontmatter('---\nkeywords: notalist\n---\n');
    expect(frontmatter?.keywords).toBeUndefined();
  });

  it('ignores a relation value that is neither a block nor an inline list', () => {
    const { frontmatter } = parseFrontmatter('---\nrelations:\n  affects: notalist\n---\n');
    expect(frontmatter?.relations).toStrictEqual({});
  });
});

describe('body extraction', () => {
  it('returns the content after the closing marker verbatim', () => {
    const { body } = parseFrontmatter('---\n"#type": concept\n---\n# Heading\n\nParagraph.\n');
    expect(body).toBe('# Heading\n\nParagraph.\n');
  });
});
