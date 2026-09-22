import { Host } from '../../platform/index.js';

export function anonymize<T extends object>(object: T): T {
  const home = Host.homedir();
  const json = JSON.stringify(object);
  return json.includes(home) ? (JSON.parse(json.replaceAll(home, '~')) as T) : object;
}
