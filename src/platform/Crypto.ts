import { createHash } from 'node:crypto';

export const Crypto = {
  sha256hex(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }
};
