// MCP knowledge-base state (ADR-0011). The index is built in-process from the local docs/ folder
// every time the server starts. GitHub fetch (ADR Part 1) is deferred — not implemented yet.

import { FileSystem, Path, __sourcesRoot, assert } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { buildKnowledgeBaseIndex } from './kbIndex.js';
import type { IDocument, IKnowledgeBaseIndex } from './kbIndex.js';

const DOCS_DIR = Path.join(__sourcesRoot, '../docs');

let _index: IKnowledgeBaseIndex | undefined;

const collectDocuments = async (): Promise<IDocument[]> => {
  const entries = await FileSystem.readdir(DOCS_DIR, { recursive: true, withFileTypes: true });
  const markdown = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'));
  return Promise.all(
    markdown.map(async (entry) => {
      const path = Path.relative(DOCS_DIR, Path.join(entry.parentPath, entry.name));
      return { path, content: await FileSystem.readFile(Path.join(DOCS_DIR, path), 'utf8') };
    })
  );
};

export const init = async (_configuration: Configuration): Promise<void> => {
  _index = buildKnowledgeBaseIndex(await collectDocuments());
};

export const getIndex = (): IKnowledgeBaseIndex => {
  assert(_index !== undefined, 'knowledge base not initialized');
  return _index;
};
