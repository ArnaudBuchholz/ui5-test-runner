import { readFile } from 'node:fs/promises';

const optionsMarkdownContent = await readFile('src/config/options.md', 'utf8');
const optionsMarkdownLines = optionsMarkdownContent.split('\n');
const properties = optionsMarkdownLines[0].split('|').slice(1, -1);
const options = optionsMarkdownLines.slice(2);
console.log('export const options = [');
for (const option of options) {
  if (!option) {
    continue;
  }
  console.log('  {');
  const values = option.split('|').slice(1);
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
