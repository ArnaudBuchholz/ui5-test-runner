import { FileSystem } from '../platform/index.js';
import { Npm } from '../Npm.js';

export const version = async () => {
  const packageFile = await FileSystem.readFile('package.json', 'utf8');
  const { name, version: installedVersion } = JSON.parse(packageFile) as { name: string; version: string };
  console.log(`${name}@${installedVersion}`);
  const latestVersion = await Npm.getLatestVersion(name);
  if (latestVersion !== installedVersion) {
    console.log(`Latest version of ${name} is ${latestVersion}`);
  }
};
