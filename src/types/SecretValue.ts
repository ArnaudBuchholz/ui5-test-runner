import type { ISecretValue } from './ISecretValue.js';

export class SecretValue implements ISecretValue {
  readonly #value: string;

  constructor(value: string) {
    this.#value = value;
  }

  reveal(): string {
    return this.#value;
  }

  toJSON(): string {
    return '***';
  }

  toString(): string {
    return '***';
  }
}
