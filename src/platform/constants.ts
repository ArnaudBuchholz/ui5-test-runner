import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
export const __sourcesRoot = dirname(dirname(__filename));
// eslint-disable-next-line unicorn/consistent-boolean-name -- "magic" like variable
export const __developmentMode = __filename.endsWith('.ts');
