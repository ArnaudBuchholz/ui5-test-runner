import { Host } from '../../platform/index.js';

export function anonymize(object: object): object {
  const home = Host.homedir();
  const json = JSON.stringify(object);
  if (json.includes(home)) {
    return JSON.parse(json.replaceAll(home, '~')) as object;
  }
  return object;
}
