import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
export const __sourcesRoot = dirname(__filename);
export const __developmentMode = __filename.endsWith('.ts');
