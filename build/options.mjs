import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const OPTIONS_FOLDER = 'docs/options';

const types = [];
const options = {};
const defaults = {};
const names = new Set();
const shorts = new Set();

for (const fileName of await readdir('src/configuration/validators')) {
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

for (const fileName of await readdir(OPTIONS_FOLDER)) {
  if (fileName.endsWith('md')) {
    const fileContent = await readFile(join(OPTIONS_FOLDER, fileName), 'utf8');
    if (!fileContent.includes('"#type": "[[option]]"')) {
      continue;
    }
    const name = fileName.split('.md')[0];
    const errors = [];
    const [, properties] = fileContent.match(/---(:?(-|[^-])*)---/) ?? [];
    const [, short] = properties.match(/short: (.*)/) ?? [];
    if (checkIfDuplicate(name, short)) {
      errors.push(`duplicate name / short detected: ${name} ${short ?? ''}`);
    }
    const [, type] = properties.match(/type: "\[\[(?:[^\\\]]+\|)?(.*)\]\]"/);
    if (!types.includes(type)) {
      errors.push(`Unknown type ${type}`);
    }
    const [, escapedDefaultValue, rawDefaultValue] = properties.match(/default: (?:"([^"]*)"|(.*))/) ?? [];
    const defaultValue = rawDefaultValue ?? escapedDefaultValue;
    const [, summary] = properties.match(/summary: (.*)/) ?? [];
    const multiple = !!/multiple: yes/.test(properties);
    if (defaultValue) {
      defaults[name] = defaultValue;
    }
    let typeModifiers;
    const [, typeModifiersList] = properties.match(/typeModifiers:((?:\n {2}- "[^"]*")*)/) ?? [];
    if (typeModifiersList) {
      typeModifiers = [];
      typeModifiersList.replaceAll(/"\[\[(?:[^\\\]]+\|)?(.*)\]\]"/g, (_, modifier) => typeModifiers.push(modifier));
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
      multiple,
      description: summary,
      default: defaultValue
    };
  }
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
        continue;
      }
      if (key === 'default') {
        console.log(`    ${key}: ${value},`);
      } else if (key === 'multiple') {
        if (value) {
          console.log(`    multiple: true,`);
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
