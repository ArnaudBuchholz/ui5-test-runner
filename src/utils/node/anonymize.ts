import { Host } from '../../platform/index.js';

export function anonymize<T extends object>(object: T): T {
  const home = Host.homedir();
  const json = JSON.stringify(object);
  if (json.includes(home)) {
    return JSON.parse(json.replaceAll(home, '~')) as T;
  }
  return object;
}
