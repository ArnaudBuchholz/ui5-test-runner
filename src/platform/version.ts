import { FileSystem } from './FileSystem.js';
import { __sourcesRoot } from './constants.js';
import { Path } from './Path.js';
import { memoize } from '../utils/shared/memoize.js';

export const version = memoize(async (): Promise<{ name: string; version: string }> => {
  return JSON.parse(
    await FileSystem.readFile(Path.join(__sourcesRoot, '../package.json'), 'utf8')
  ) as { name: string; version: string };
});
