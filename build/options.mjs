import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const OPTIONS_FOLDER = 'docs/options';

const types = [];
const options = {};
const defaults = {};
const names = new Set();
const shorts = new Set();

const validatorsFileNames = await readdir('src/configuration/validators');
for (const fileName of validatorsFileNames) {
  const [, typeName] = fileName.match(/^(\w+)\.ts$/) ?? [];
  if (typeName && !['OptionValidator', 'index'].includes(typeName)) {
    types.push(typeName.replaceAll(/([A-Z])/g, (_, letter) => `-${letter.toLowerCase()}`));
  }
}

const checkIfDuplicate = (name, short) => {
  if (names.has(name) || (short && shorts.has(short))) {
    return true;
  }
  names.add(name);
  if (short) {
    shorts.add(short);
  }
  return false;
};

const optionsFileNames = await readdir(OPTIONS_FOLDER);
for (const fileName of optionsFileNames) {
  if (!fileName.endsWith('md')) {
    continue;
  }

  const fileContent = await readFile(join(OPTIONS_FOLDER, fileName), 'utf8');
  if (!fileContent.includes('"#type": "[[option]]"')) {
    continue;
  }
  const name = fileName.split('.md', 1)[0];
  const errors = [];
  const [, properties] = fileContent.match(/---(:?(-|[^-])*)---/) ?? [];
  const [, short] = properties.match(/short: (.*)/) ?? [];
  if (checkIfDuplicate(name, short)) {
    errors.push(`duplicate name / short detected: ${name} ${short ?? ''}`);
  }
  // eslint-disable-next-line sonarjs/super-linear-regex -- optional prefix is bounded by [^\]] so catastrophic backtracking cannot occur
  const [, type] = properties.match(/type: "\[\[(?:[^\\\]]+\|)?([^\]]*)\]\]"/);
  if (!types.includes(type)) {
    errors.push(`Unknown type ${type}`);
  }
  const [, escapedDefaultValue, rawDefaultValue] = properties.match(/default: (?:"([^"]*)"|(.*))/) ?? [];
  const defaultValue = rawDefaultValue ?? escapedDefaultValue;
  const [, summary] = properties.match(/summary: (.*)/) ?? [];
  const isMultiple = !!/multiple: yes/.test(properties);
  const isBrowserExposed = !!/browserExposed: yes/.test(properties);
  const isBatchForwarded = !!/batchForwarded: yes/.test(properties);
  if (defaultValue) {
    defaults[name] = defaultValue;
  }
  let typeModifiers;
  const [, typeModifiersList] = properties.match(/typeModifiers:((?:\n {2}- "[^"]*")*)/) ?? [];
  if (typeModifiersList) {
    typeModifiers = [];
    // eslint-disable-next-line sonarjs/super-linear-regex -- optional prefix is bounded by [^\]] so catastrophic backtracking cannot occur
    typeModifiersList.replaceAll(/"\[\[(?:[^\\\]]+\|)?([^\]]*)\]\]"/g, (_, modifier) => {
      typeModifiers.push(modifier);
    });
  }
  if (errors.length > 0) {
    console.error(`❌ ${fileName} :\n\t` + errors.join('\n\t'));
    process.exitCode = 1;
  }
  options[name] = {
    name,
    short,
    type,
    typeModifiers,
    multiple: isMultiple,
    browserExposed: isBrowserExposed,
    batchForwarded: isBatchForwarded,
    description: summary,
    default: defaultValue
  };
}

// TODO: leverage dependsOn
/* Order of options determines when they are validated,
   because of dependencies (like webapp depends on cwd) we must carefully craft the list
*/
const sortedOptionNames = ['cwd', 'webapp', 'testsuite'];
for (const name of Object.keys(options)) {
  if (!sortedOptionNames.includes(name)) {
    sortedOptionNames.push(name);
  }
}

if (!process.exitCode) {
  console.log(`export const options = [`);
  for (const name of sortedOptionNames) {
    console.log(` {`);
    const option = options[name];
    for (const [key, value] of Object.entries(option)) {
      if (value === undefined) {
        // eslint-disable-next-line unicorn/no-break-in-nested-loop -- helper function
        continue;
      }
      if (key === 'default') {
        console.log(`    ${key}: ${value},`);
      } else if (key === 'multiple') {
        if (value) {
          console.log(`    multiple: true,`);
        }
      } else if (key === 'browserExposed') {
        if (value) {
          console.log(`    browserExposed: true,`);
        }
      } else if (key === 'batchForwarded') {
        if (value) {
          console.log(`    batchForwarded: true,`);
        }
      } else if (key === 'typeModifiers') {
        console.log(`    typeModifiers: new Set(${JSON.stringify(value).replaceAll('"', "'")} as const),`);
      } else {
        console.log(`    ${key}: '${value}',`);
      }
    }
    console.log(` },`);
  }
  console.log(`] as const;

export const defaults = {`);
  for (const [key, value] of Object.entries(defaults)) {
    console.log(`    ${key}: ${value},`);
  }
  console.log(`} as const;`);
}
