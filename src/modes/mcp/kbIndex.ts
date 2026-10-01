// Runtime knowledge-base index (ADR-0011 Part 1.5).
//
// Pure port of the build-time algorithm in build/lib/kbEntities.mjs — the constants here
// (ENTITY_TYPES, ID_RELATIONS, SHA_LENGTH, deriveId) MUST stay identical to that reference.
// Unlike the build index, this runtime index additionally retains each entity's `path` and `body`
// so `get_topic` can serve the markdown, and it exposes a reverse-edge lookup for "Related topics".
//
// The build already validates authored docs strictly; at runtime we are permissive — a malformed or
// duplicate entity is skipped (logged at debug), never fatal, so a bad doc cannot take the server down.

import { Crypto, logger } from '../../platform/index.js';
import { parseFrontmatter } from './frontmatter.js';

const ENTITY_TYPES = new Set(['option', 'mode', 'concept', 'task']);

// Relations whose values are entity ids (used to build the reverse index). `breaking-in` is excluded:
// its values are version tokens, not ids.
const ID_RELATIONS = ['see-also', 'affects', 'requires', 'supersedes'] as const;

// 16 hex chars (64-bit) is ample to detect content changes; it is a cache key, not a security digest.
const SHA_LENGTH = 16;

export type Relations = Record<string, string[]>;

export interface IEntity {
  readonly id: string;
  readonly '#type': string;
  readonly title: string;
  readonly summary: string;
  readonly keywords: string[];
  readonly relations: Relations;
  readonly sha: string;
  readonly path: string;
  readonly body: string;
}

// The trimmed projection handed to the LLM: no keywords (build-time only), no sha/path/body.
export interface ICatalogEntry {
  readonly id: string;
  readonly '#type': string;
  readonly title: string;
  readonly summary: string;
  readonly relations: Relations;
}

export interface IReverseRelation {
  readonly id: string;
  readonly relation: string;
}

export interface IKnowledgeBaseIndex {
  readonly catalog: ICatalogEntry[];
  getEntity(id: string): IEntity | undefined;
  getReverseRelations(id: string): IReverseRelation[];
}

export interface IDocument {
  readonly path: string;
  readonly content: string;
}

// Derive an id from a docs-relative path: drop `.md`, drop a trailing `/index`, verbatim casing.
export const deriveId = (documentationRelativePath: string): string => {
  const withoutExtension = documentationRelativePath.replaceAll('\\', '/').replace(/\.md$/, '');
  return withoutExtension.replace(/\/index$/, '');
};

const toCatalogEntry = (entity: IEntity): ICatalogEntry => ({
  id: entity.id,
  '#type': entity['#type'],
  title: entity.title,
  summary: entity.summary,
  relations: entity.relations
});

// Parse one document into an entity, or null when it is not a KB entity (no frontmatter / no `#type`)
// or is malformed (unknown `#type`). Malformed entities are logged at debug and skipped.
const toEntity = ({ path, content }: IDocument): IEntity | null => {
  const { frontmatter, body } = parseFrontmatter(content);
  if (frontmatter === null || frontmatter['#type'] === undefined) {
    return null;
  }
  const type = frontmatter['#type'];
  if (!ENTITY_TYPES.has(type)) {
    logger.debug({ source: 'mcp', message: `skipping ${path}: invalid #type '${type}'` });
    return null;
  }
  if (frontmatter.title === undefined || frontmatter.summary === undefined) {
    logger.debug({ source: 'mcp', message: `skipping ${path}: missing title or summary` });
    return null;
  }
  return {
    id: frontmatter.id ?? deriveId(path),
    '#type': type,
    title: frontmatter.title,
    summary: frontmatter.summary,
    keywords: frontmatter.keywords ?? [],
    relations: frontmatter.relations ?? {},
    sha: Crypto.sha256hex(content).slice(0, SHA_LENGTH),
    path,
    body
  };
};

const buildReverseIndex = (entities: IEntity[]): Map<string, IReverseRelation[]> => {
  const reverse = new Map<string, IReverseRelation[]>();
  for (const entity of entities) {
    for (const relation of ID_RELATIONS) {
      const targets = entity.relations[relation] ?? [];
      for (const target of targets) {
        const existing = reverse.get(target) ?? [];
        existing.push({ id: entity.id, relation });
        reverse.set(target, existing);
      }
    }
  }
  return reverse;
};

export const buildKnowledgeBaseIndex = (documents: IDocument[]): IKnowledgeBaseIndex => {
  const byId = new Map<string, IEntity>();
  for (const document of documents) {
    const entity = toEntity(document);
    if (entity === null) {
      continue;
    }
    if (byId.has(entity.id)) {
      logger.debug({ source: 'mcp', message: `skipping ${entity.path}: duplicate id '${entity.id}'` });
      continue;
    }
    byId.set(entity.id, entity);
  }

  const entities = byId.values().toArray();
  const reverse = buildReverseIndex(entities);
  const catalog = entities
    .map((entity) => toCatalogEntry(entity))
    .toSorted((left, right) => left.id.localeCompare(right.id));

  return {
    catalog,
    getEntity: (id) => byId.get(id),
    getReverseRelations: (id) => reverse.get(id) ?? []
  };
};
