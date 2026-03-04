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
    // eslint-disable-next-line security/detect-unsafe-regex, sonarjs/slow-regex -- not for productive use
    const [, type] = properties.match(/type: "\[\[(?:[^\\\]]+\|)?(.*)\]\]"/);
    if (!types.includes(type)) {
      errors.push(`Unknown type ${type}`);
    }
    const [, defaultValue] = properties.match(/default: "([^"]*)"/) ?? [];
    const [, summary] = properties.match(/summary: (.*)/) ?? [];
    const multiple = !!/multiple: yes/.test(properties);
    if (defaultValue) {
      defaults[name] = defaultValue;
    }
    if (errors.length > 0) {
      console.error(`❌ ${fileName} :\n\t` + errors.join('\n\t'));
      process.exitCode = 1;
    }
    options[name] = {
      name,
      short,
      type,
      multiple,
      description: summary,
      default: defaultValue
    };
  }
}

if (!process.exitCode) {
  console.log(`export const options = [`);
  for (const name of Object.keys(options).toSorted()) {
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
      } else {
        console.log(`    ${key}: '${value}',`);
      }
    }
    console.log(` },`);
  }
  console.log(`] as const;

export const defaults = ${JSON.stringify(defaults, undefined, 2)} as const;`);
}
