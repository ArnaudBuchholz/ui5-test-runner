export interface ISecretValue {
  reveal(): string;
}

export const isSecretValue = (value: unknown): value is ISecretValue =>
  typeof (value as ISecretValue)?.reveal === 'function';
