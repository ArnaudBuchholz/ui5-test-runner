import { readFile } from 'node:fs/promises';

const optionsMarkdownContent = await readFile('src/configuration/options.md', 'utf8');
const optionsMarkdownLines = optionsMarkdownContent.split('\n');
const properties = optionsMarkdownLines[0].split('|').slice(1, -1);
const options = optionsMarkdownLines.slice(2);

const names = new Set();
const shorts = new Set();

const check = (name, short) => {
  if (names.has(name) || short && shorts.has(short)) {
    console.error('⚠️  duplicate name / short detected:', name, short);
  }
  names.add(name);
  if (short) {
    shorts.add(short);
  }
};

console.log('export const options = [');
for (const option of options) {
  if (!option) {
    continue;
  }
  console.log('  {');
  const values = option
    .replaceAll(/\\\|/g, 'ǁ')
    .split('|')
    .slice(1)
    .map(value => value.replaceAll(/ǁ/g, '|'));
  check(values[0], values[1]);
  for (const [index, property] of properties.entries()) {
    const value = values[index];
    if (!value) {
      continue;
    }
    if (property === 'multiple') {
      console.log(`    ${property}: true,`);
    } else if (property === 'default') {
      console.log(`    ${property}: ${value},`);
    } else if (property !== 'flags') {
      console.log(`    ${property}: '${value}',`);
    }
  }

  console.log('  },');
}
console.log('] as const;');
