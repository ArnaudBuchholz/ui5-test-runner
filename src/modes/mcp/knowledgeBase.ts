import { FileSystem, Path, __sourcesRoot } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';

const REMOTE_KB_DIR = Path.join(__sourcesRoot, 'mcp-kb');

let _dir: string = REMOTE_KB_DIR;

export const init = async (configuration: Configuration): Promise<void> => {
  if (configuration.debugMcpLocalDocs) {
    _dir = Path.join(__sourcesRoot, '../docs');
  } else {
    // TODO: implement GitHub fetch strategy (see ADR-0011)
    _dir = REMOTE_KB_DIR;
  }
};

export const readFile = (relativePath: string): Promise<string> =>
  FileSystem.readFile(Path.join(_dir, relativePath), 'utf8');

export const readdir = (
  relativePath: string,
  options?: Parameters<typeof FileSystem.readdir>[1]
): ReturnType<typeof FileSystem.readdir> => FileSystem.readdir(Path.join(_dir, relativePath), options);
