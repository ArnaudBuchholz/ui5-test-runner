import { FileSystem, Path } from '../../platform/index.js';
import { Crypto } from '../../platform/Crypto.js';
import { memoize } from '../../utils/shared/memoize.js';
import { getRoot, readdir } from './knowledgeBase.js';

const normalize = (folderRelativePath: string): string => {
  const cleaned = folderRelativePath.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '');
  return cleaned === '.' ? '' : cleaned;
};

export const hashFolder = (folderRelativePath: string): string =>
  Crypto.sha256hex(normalize(folderRelativePath)).slice(0, 6);

const collectSubfolders = async (root: string, folder: string, queue: string[]): Promise<void> => {
  const directoryPath = folder === '' ? '.' : folder;
  const entries = await readdir(directoryPath);
  for (const entry of entries) {
    const entryRelativePath = folder === '' ? entry : `${folder}/${entry}`;
    const stat = await FileSystem.stat(Path.join(root, entryRelativePath));
    if (stat.isDirectory()) {
      queue.push(entryRelativePath);
    }
  }
};

const buildReverseIndex = async (): Promise<Map<string, string>> => {
  const root = getRoot();
  const index = new Map<string, string>();
  const queue: string[] = [''];
  while (queue.length > 0) {
    const folder = queue.shift()!;
    const hash = hashFolder(folder);
    if (index.has(hash)) {
      const existing = index.get(hash)!;
      if (existing !== folder) {
        throw new Error(`Hash collision: folders "${existing}" and "${folder}" both hash to "${hash}"`);
      }
    }
    index.set(hash, folder);
    await collectSubfolders(root, folder, queue);
  }
  return index;
};

export const getReverseIndex: () => Promise<Map<string, string>> = memoize(buildReverseIndex);
