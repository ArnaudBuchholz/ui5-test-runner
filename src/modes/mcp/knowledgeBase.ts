import { FileSystem, Path, __sourcesRoot } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { setTimeout } from 'node:timers/promises';

const REMOTE_KB_DIR = Path.join(__sourcesRoot, 'mcp-kb');

let _knowledgeBaseDirectory: string = REMOTE_KB_DIR;

export const init = async (configuration: Configuration): Promise<void> => {
  if (configuration.debugMcpLocalDocs) {
    _knowledgeBaseDirectory = Path.join(__sourcesRoot, '../docs');
  } else {
    // TODO: implement GitHub fetch strategy (see ADR-0011)
    await setTimeout(0);
    _knowledgeBaseDirectory = REMOTE_KB_DIR;
  }
};

export const readFile = (relativePath: string): Promise<string> =>
  FileSystem.readFile(Path.join(_knowledgeBaseDirectory, relativePath), 'utf8');

export const readdir = async (relativePath: string): Promise<string[]> =>
  await FileSystem.readdir(Path.join(_knowledgeBaseDirectory, relativePath));
