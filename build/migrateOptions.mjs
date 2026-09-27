// One-shot migration: bring docs/options/*.md frontmatter to the KB entity model (ADR-0011 Part 1.5).
//
// Textual edits only — never yaml.parse -> re-dump. Key ordering across files is inconsistent and
// values include delicate validation.conditions strings; re-dumping would produce huge, risky diffs.
// This touches exactly three keys and leaves every other line byte-for-byte identical:
//   - `tags:`  -> `keywords:`            (key line only; value lines untouched, incl. "#debug" quoting)
//   - `see:`   -> `relations.see-also:`  (each bare option target prefixed `options/`)
//   - inserts `title: <name>` after the `"#type":` line when absent
//
// The generator (build/options.mjs) does not read tags/see, so `make options` output must stay
// byte-identical after this runs — that is the safety invariant verified separately.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const OPTIONS_FOLDER = 'docs/options';
const FRONTMATTER_RE = /^---\n([\s\S]*?\n)---/;

const fail = (fileName, message) => {
  console.error(`❌ ${fileName} : ${message}`);
  process.exitCode = 1;
};

// Extract the contiguous block-list under a key line at index `start` (a line matching `^<key>:\s*$`).
// Returns { values, end } where end is the index one past the last consumed line, or null if the
// shape is not the expected `key:` followed by zero or more `  - value` lines.
const readBlockList = (lines, start) => {
  const values = [];
  let i = start + 1;
  while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
    values.push(lines[i].replace(/^\s+-\s+/, '').trim());
    i++;
  }
  return { values, end: i };
};

const migrate = (fileName, content) => {
  const match = content.match(FRONTMATTER_RE);
  if (!match) {
    return null; // no frontmatter -> not an option entity, skip silently
  }
  const rawFrontmatter = match[1]; // between the fences, trailing newline included
  const prefixLen = match[0].length;
  const body = content.slice(prefixLen); // everything AFTER the closing `---` (fence already consumed by the regex)

  const lines = rawFrontmatter.replace(/\n$/, '').split('\n');
  const out = [];
  let sawType = false;
  let hasTitle = false;
  let hasRelations = false;
  let seeValues = null;

  // First pass: detect title/relations presence for guards.
  for (const line of lines) {
    if (/^title:/.test(line)) hasTitle = true;
    if (/^relations:\s*$/.test(line)) hasRelations = true;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^"#type":\s*option\s*$/.test(line)) {
      sawType = true;
      out.push(line);
      if (!hasTitle) {
        const name = fileName.replace(/\.md$/, '');
        out.push(`title: ${name}`);
      }
      continue;
    }

    if (/^tags:\s*$/.test(line)) {
      out.push('keywords:');
      continue;
    }

    if (/^see:\s*$/.test(line)) {
      const { values, end } = readBlockList(lines, i);
      if (values.length === 0) {
        fail(fileName, 'empty see: block — unexpected shape');
        return null;
      }
      seeValues = values;
      i = end - 1; // skip consumed value lines
      continue;
    }

    out.push(line);
  }

  if (!sawType) {
    fail(fileName, 'no `"#type": option` line found');
    return null;
  }
  if (seeValues && hasRelations) {
    fail(fileName, 'both see: and relations: present — manual merge required');
    return null;
  }

  if (seeValues) {
    out.push('relations:');
    out.push('  see-also:');
    for (const target of seeValues) {
      out.push(`    - options/${target}`);
    }
  }

  return `---\n${out.join('\n')}\n---${body}`;
};

const fileNames = await readdir(OPTIONS_FOLDER);
let migrated = 0;
for (const fileName of fileNames) {
  if (!fileName.endsWith('.md')) {
    continue;
  }
  const path = join(OPTIONS_FOLDER, fileName);
  const content = await readFile(path, 'utf8');
  const result = migrate(fileName, content);
  if (result === null) {
    continue;
  }
  if (result !== content) {
    await writeFile(path, result);
    migrated++;
  }
}

if (!process.exitCode) {
  console.log(`✅ migrated ${migrated} option file(s)`);
}
