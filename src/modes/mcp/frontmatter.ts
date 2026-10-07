// Minimal, dependency-free frontmatter parser for the MCP knowledge-base runtime.
//
// This is NOT a general YAML parser: it recognizes only the shapes KB entity frontmatter uses
// (ADR-0011 Part 1.5) and silently drops everything else. `yaml` (the full parser used by the
// build-time pipeline in build/lib/kbEntities.mjs) is ISC-licensed and cannot become a production
// dependency (MIT-only rule), so the runtime reads frontmatter with this allowlist parser instead.
//
// Recognized shapes:
//   key: scalar                 — top-level string scalar (quoted or unquoted)
//   key: [a, b]                 — inline-flow string list
//   key:\n  - a\n  - b          — block string list
//   key:\n  sub: [a]            — one level of nested mapping whose values are string lists
// Any construct it does not model (option-only keys, the nested `validation:` list-of-mappings,
// deeper nesting) is skipped without error.

const FRONTMATTER_RE = /^---\n([\s\S]*?\n)---\n?([\s\S]*)$/;

export interface IFrontmatter {
  '#type'?: string;
  id?: string;
  title?: string;
  summary?: string;
  keywords?: string[];
  relations?: Record<string, string[]>;
}

export interface IParsedDocument {
  frontmatter: IFrontmatter | null;
  body: string;
}

const KNOWN_SCALARS = new Set(['#type', 'id', 'title', 'summary']);

// Assign one of the four modeled scalar keys. A switch keeps the write type-safe without an `as`
// cast; `KNOWN_SCALARS` has already filtered the key to these values.
const assignScalar = (frontmatter: IFrontmatter, key: string, value: string): void => {
  switch (key) {
    case '#type': {
      frontmatter['#type'] = value;
      break;
    }
    case 'id': {
      frontmatter.id = value;
      break;
    }
    case 'title': {
      frontmatter.title = value;
      break;
    }
    case 'summary': {
      frontmatter.summary = value;
      break;
    }
  }
};

const stripQuotes = (value: string): string => {
  const trimmed = value.trim();
  return trimmed.length >= 2 && (trimmed.startsWith('"') || trimmed.startsWith("'")) && trimmed.endsWith(trimmed[0]!)
    ? trimmed.slice(1, -1)
    : trimmed;
};

// Parse an inline-flow list `[a, "b", c]` into trimmed, unquoted items. Returns null when `value`
// is not an inline list (e.g. a block list introduced by a bare `key:`).
const parseInlineList = (value: string): string[] | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
    return null;
  }
  const inner = trimmed.slice(1, -1).trim();
  return inner === '' ? [] : inner.split(',').map((item) => stripQuotes(item));
};

// Split a line into its indentation width and content (content is '' for a blank line).
const measure = (line: string): { indent: number; content: string } => {
  const trimmed = line.trimStart();
  return { indent: line.length - trimmed.length, content: trimmed.trimEnd() };
};

// A `key:` line with no value introduces a block collection on the following, more-indented lines.
// `collectBlock` consumes those lines as a string list, stopping at the first line that is not a
// list item (`- …`) at a deeper indent. Returns the items and the index of the first unconsumed line.
const collectBlock = (lines: string[], start: number, parentIndent: number): { items: string[]; next: number } => {
  const items: string[] = [];
  let index = start;
  while (index < lines.length) {
    const { indent, content } = measure(lines[index]!);
    if (content === '') {
      index += 1;
      continue;
    }
    if (indent <= parentIndent || !content.startsWith('- ')) {
      break;
    }
    items.push(stripQuotes(content.slice(2)));
    index += 1;
  }
  return { items, next: index };
};

// Read a string list that is either inline (`value` is `[a, b]`) or, when `value` is empty, a block
// list on the following more-indented `- item` lines. `items` is null when `value` is a non-list
// scalar (neither inline list nor block introducer). `next` is the first unconsumed line index.
const readList = (
  lines: string[],
  start: number,
  parentIndent: number,
  value: string
): { items: string[] | null; next: number } => {
  if (value === '') {
    const block = collectBlock(lines, start, parentIndent);
    return { items: block.items, next: block.next };
  }
  return { items: parseInlineList(value), next: start };
};

// Parse the nested `relations:` mapping. Its direct children are `sub: [..]` or `sub:` block lists;
// anything else at that level is skipped. Returns the relations map and the first unconsumed index.
const collectRelations = (
  lines: string[],
  start: number,
  parentIndent: number
): { relations: Record<string, string[]>; next: number } => {
  const relations: Record<string, string[]> = {};
  let index = start;
  while (index < lines.length) {
    const { indent, content } = measure(lines[index]!);
    if (content === '') {
      index += 1;
      continue;
    }
    if (indent <= parentIndent) {
      break;
    }
    const colon = content.indexOf(':');
    if (colon === -1) {
      index += 1;
      continue;
    }
    const key = content.slice(0, colon).trim();
    const list = readList(lines, index + 1, indent, content.slice(colon + 1).trim());
    index = list.next;
    if (list.items !== null) {
      relations[key] = list.items;
    }
  }
  return { relations, next: index };
};

// Skip any lines more indented than `parentIndent` (used to swallow unmodeled nested structures such
// as `validation:`'s list-of-mappings, whose items are `- key:` followed by deeper lines).
const skipIndentedBlock = (lines: string[], start: number, parentIndent: number): number => {
  let index = start;
  while (index < lines.length) {
    const { indent, content } = measure(lines[index]!);
    if (content !== '' && indent <= parentIndent) {
      break;
    }
    index += 1;
  }
  return index;
};

// Apply one top-level `key: value` entry to `frontmatter`, consuming any block it introduces.
// Returns the first unconsumed line index.
const applyEntry = (
  frontmatter: IFrontmatter,
  lines: string[],
  index: number,
  indent: number,
  key: string,
  value: string
): number => {
  if (key === 'relations' && value === '') {
    const result = collectRelations(lines, index, indent);
    frontmatter.relations = result.relations;
    return result.next;
  }
  if (key === 'keywords') {
    const list = readList(lines, index, indent, value);
    if (list.items !== null) {
      frontmatter.keywords = list.items;
    }
    return list.next;
  }
  if (value !== '' && KNOWN_SCALARS.has(key)) {
    assignScalar(frontmatter, key, stripQuotes(value));
    return index;
  }
  if (value === '') {
    // A bare `key:` we do not model (e.g. `validation:`) introduces a collection; skip all its
    // more-indented children so they are not mistaken for top-level keys.
    return skipIndentedBlock(lines, index, indent);
  }
  return index;
};

const parseMetadata = (raw: string): IFrontmatter => {
  const frontmatter: IFrontmatter = {};
  const lines = raw.split('\n');
  let index = 0;
  while (index < lines.length) {
    const { indent, content } = measure(lines[index]!);
    const colon = content.indexOf(':');
    // Only top-level `key: value` lines are modeled; indented lines (already consumed by their
    // introducing key) and colon-less lines — which includes blank lines — are skipped.
    if (colon === -1 || indent > 0) {
      index += 1;
      continue;
    }
    index = applyEntry(
      frontmatter,
      lines,
      index + 1,
      indent,
      stripQuotes(content.slice(0, colon)),
      content.slice(colon + 1).trim()
    );
  }
  return frontmatter;
};

export const parseFrontmatter = (content: string): IParsedDocument => {
  const match = FRONTMATTER_RE.exec(content);
  return match ? { frontmatter: parseMetadata(match[1]!), body: match[2]! } : { frontmatter: null, body: content };
};
