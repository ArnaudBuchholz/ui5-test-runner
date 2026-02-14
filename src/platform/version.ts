import { FileSystem } from './FileSystem.js';
import { __sourcesRoot } from './constants.js';
import { Path } from './Path.js';

export const version = async (): Promise<string> => {
  const { name, version } = JSON.parse(
    await FileSystem.readFile(Path.join(__sourcesRoot, '../package.json'), 'utf8')
  ) as { name: string; version: string };
  return `${name}@${version}`;
};
