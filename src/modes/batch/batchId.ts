import { createHash } from 'node:crypto';
import { basename } from 'node:path';

export const batchId = (filePath: string): string => {
  const hash = createHash('shake256', { outputLength: 8 });
  hash.update(filePath);
  return hash.digest('base64url');
};

export const batchLabel = (filePath: string): string => basename(filePath);
