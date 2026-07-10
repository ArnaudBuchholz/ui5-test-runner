import { Host } from '../../platform/index.js';

export function anonymize(obj: object): object {
  const home = Host.homedir();
  const json = JSON.stringify(obj);
  if (json.includes(home)) {
    return JSON.parse(json.replaceAll(home, '~'));
  }
  return obj;
}
