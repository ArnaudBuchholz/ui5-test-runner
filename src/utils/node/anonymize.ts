import { Host } from '../../platform/Host.js';
import { isSecretValue } from '../../types/ISecretValue.js';

const redactSecretsReplacer = (_: string, value: unknown) => (isSecretValue(value) ? '***' : value);

export function redactSecrets<T extends object>(object: T): T {
  return JSON.parse(JSON.stringify(object, redactSecretsReplacer)) as T;
}

export function anonymize<T extends object>(object: T): T {
  const home = Host.homedir();
  const json = JSON.stringify(redactSecrets(object));
  return json.includes(home) ? (JSON.parse(json.replaceAll(home, '~')) as T) : object;
}
