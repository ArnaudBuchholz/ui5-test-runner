// Shared knowledge-base entity logic (ADR-0011 Part 1.5).
//
// Scans a docs directory, treats frontmatter-bearing markdown as KB entities, derives ids, validates
// the entity model, and builds the index. Kept dependency-light (only `yaml`, already a project dep)
// and framework-free so the MCP runtime can reuse it when the index is built on demand.

import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';

const FRONTMATTER_RE = /^---\n([\s\S]*?\n)---\n?([\s\S]*)$/;
const ENTITY_TYPES = new Set(['option', 'mode', 'concept', 'task']);

// Relations whose values are entity ids and must resolve. `breaking-in` is excluded: its values are
// version tokens (e.g. `v6`), not ids.
const ID_RELATIONS = ['see-also', 'affects', 'requires', 'supersedes'];

const MAX_BODY_LINES = 300;

// Derive an id from a docs-relative path: drop `.md`, drop a trailing `/index`, verbatim casing.
export const deriveId = (documentationRelativePath) => {
  const withoutExtension = documentationRelativePath.replaceAll('\\', '/').replace(/\.md$/, '');
  return withoutExtension.replace(/\/index$/, '');
};

const sha256 = (content) => createHash('sha256').update(content).digest('hex');

// Recursively collect all .md paths under `directory`, relative to `directory`.
const collectMarkdown = async (directory) => {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => relative(directory, join(entry.parentPath ?? entry.path, entry.name)));
};

// Validate the mandatory KB fields and body size of an entity's metadata. Returns a list of problems.
const validateFields = (metadata, body) => {
  const problems = [];
  if (typeof metadata.title !== 'string' || metadata.title.trim() === '') {
    problems.push('missing title');
  }
  if (typeof metadata.summary !== 'string' || metadata.summary.trim() === '') {
    problems.push('missing summary');
  }
  if (!Array.isArray(metadata.keywords) || metadata.keywords.length === 0) {
    problems.push('missing non-empty keywords');
  }
  const bodyLines = body.split('\n').length;
  if (bodyLines > MAX_BODY_LINES) {
    problems.push(`body has ${bodyLines} lines (max ${MAX_BODY_LINES}); split into smaller entities`);
  }
  return problems;
};

// Parse one file into an entity descriptor, or null if it is not a KB entity (no frontmatter, or
// frontmatter without a `#type` key). Pushes human-readable messages to `errors` on malformed entities.
const parseEntity = (relativePath, content, errors) => {
  const match = content.match(FRONTMATTER_RE);
  if (!match) {
    return null; // boundary rule: no frontmatter -> not an entity, silently ignored
  }
  const [, rawFrontmatter, body] = match;

  let metadata;
  try {
    metadata = parseYaml(rawFrontmatter);
  } catch (error) {
    errors.push(`${relativePath}: invalid YAML frontmatter (${error.message})`);
    return null;
  }
  if (metadata === null || typeof metadata !== 'object') {
    errors.push(`${relativePath}: frontmatter is not a mapping`);
    return null;
  }

  // Boundary rule: only frontmatter carrying a `#type` key is a KB entity. Frontmatter without it
  // (e.g. the type-modifier docs' `types:` metadata) is not an entity and is ignored. A `#type` that
  // is present but invalid still fails loudly — silently skipping applies only to its total absence.
  if (!Object.hasOwn(metadata, '#type')) {
    return null;
  }

  const type = metadata['#type'];
  if (!ENTITY_TYPES.has(type)) {
    errors.push(`${relativePath}: invalid #type '${type ?? ''}' (expected one of ${[...ENTITY_TYPES].join(', ')})`);
    return null;
  }

  const problems = validateFields(metadata, body);
  if (problems.length > 0) {
    errors.push(`${relativePath}: ${problems.join('; ')}`);
    return null;
  }

  const hasExplicitId = typeof metadata.id === 'string' && metadata.id.trim() !== '';
  return {
    id: hasExplicitId ? metadata.id.trim() : deriveId(relativePath),
    '#type': type,
    title: metadata.title,
    summary: metadata.summary,
    keywords: metadata.keywords,
    relations: metadata.relations ?? {},
    sha: sha256(content)
  };
};

// Resolve one relation's targets against the known id set, pushing an error per dangling edge.
const validateRelation = (entity, relation, ids, errors) => {
  const targets = entity.relations[relation];
  if (targets === undefined || targets === null) {
    return;
  }
  if (!Array.isArray(targets)) {
    errors.push(`${entity.id}: relations.${relation} must be a list`);
    return;
  }
  for (const target of targets) {
    if (!ids.has(target)) {
      errors.push(`${entity.id}: relations.${relation} -> '${target}' does not resolve to a known entity`);
    }
  }
};

// Resolve every id-valued relation edge against the known id set, pushing an error per dangling edge.
const validateEdges = (entities, ids, errors) => {
  for (const entity of entities) {
    for (const relation of ID_RELATIONS) {
      validateRelation(entity, relation, ids, errors);
    }
  }
};

// Pass 1: parse every markdown file, per-entity validate, and collect ids (rejecting duplicates).
// Returns the entity list and the id -> path map; pushes messages to `errors`.
const collectEntities = async (documentationDirectory, relativePaths, errors) => {
  const entities = [];
  const idToPath = new Map();
  for (const relativePath of relativePaths) {
    const content = await readFile(join(documentationDirectory, relativePath), 'utf8');
    const entity = parseEntity(relativePath, content, errors);
    if (entity === null) {
      continue;
    }
    if (idToPath.has(entity.id)) {
      errors.push(`${relativePath}: duplicate id '${entity.id}' (also ${idToPath.get(entity.id)})`);
      continue;
    }
    idToPath.set(entity.id, relativePath);
    entities.push(entity);
  }
  return { entities, idToPath };
};

// Build the KB index for `documentationDirectory`. Returns { index, errors }.
// index is an array of entity descriptors; errors is a list of validation messages (empty = valid).
export const buildIndex = async (documentationDirectory) => {
  const relativePaths = await collectMarkdown(documentationDirectory);
  const errors = [];

  // Pass 1: parse, per-entity validate, collect ids. Pass 2: resolve relation edges.
  const { entities, idToPath } = await collectEntities(documentationDirectory, relativePaths, errors);
  validateEdges(entities, new Set(idToPath.keys()), errors);

  entities.sort((left, right) => left.id.localeCompare(right.id));
  return { index: entities, errors };
};

export { MAX_BODY_LINES };
