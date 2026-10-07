// Build the knowledge-base index (ADR-0011 Part 1.5) and validate the entity model.
//
// Emits kb-index.json (gitignored — generated on demand, not committed). Fails the build (exit 1)
// on any invalid entity: missing mandatory field, duplicate id, dangling relation edge, or oversized
// body. Files without frontmatter are silently ignored (boundary rule).

import { writeFile } from 'node:fs/promises';
import { buildIndex } from './lib/kbEntities.mjs';

const DOCS_DIR = 'docs';
const OUTPUT = 'kb-index.json';

const { index, errors } = await buildIndex(DOCS_DIR);

if (errors.length > 0) {
  console.error(`❌ knowledge base validation failed (${errors.length} error(s)):`);
  for (const error of errors) {
    console.error(`\t${error}`);
  }
  process.exitCode = 1;
} else {
  // Minified: the index is gitignored, machine-consumed data — the source markdown is the
  // human-readable form. Skipping indentation saves ~23% on disk with no information loss.
  await writeFile(OUTPUT, JSON.stringify(index) + '\n');
  console.log(`✅ ${OUTPUT}: ${index.length} entit${index.length === 1 ? 'y' : 'ies'}`);
}
