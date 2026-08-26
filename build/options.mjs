import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const OPTIONS_FOLDER = 'docs/options';

const types = [];
const options = {};
const defaults = {};
const validations = [];
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
  const [, rawFrontmatter] = fileContent.match(/^---\n([\s\S]*?\n)---/) ?? [];
  if (!rawFrontmatter) {
    continue;
  }
  const metadata = parseYaml(rawFrontmatter);
  if (metadata['#type'] !== '[[option]]') {
    continue;
  }
  const name = fileName.split('.md', 1)[0];
  const errors = [];
  const short = metadata.short ? String(metadata.short) : undefined;
  if (checkIfDuplicate(name, short)) {
    errors.push(`duplicate name / short detected: ${name} ${short ?? ''}`);
  }
  // eslint-disable-next-line sonarjs/super-linear-regex -- optional prefix is bounded by [^\]] so catastrophic backtracking cannot occur
  const [, type] = (metadata.type ?? '').match(/\[\[(?:[^\\\]]+\|)?([^\]]*)\]\]/) ?? [];
  if (!type || !types.includes(type)) {
    errors.push(`Unknown type ${metadata.type}`);
  }
  const defaultValue = metadata.default === undefined ? undefined : String(metadata.default);
  const summary = metadata.summary;
  const isMultiple = metadata.multiple === 'yes' || metadata.multiple === true;
  const isBrowserExposed = metadata.browserExposed === 'yes' || metadata.browserExposed === true;
  const isBatchForwarded = metadata.batchForwarded === 'yes' || metadata.batchForwarded === true;
  if (defaultValue) {
    defaults[name] = defaultValue;
  }
  let typeModifiers;
  if (Array.isArray(metadata.typeModifiers)) {
    typeModifiers = metadata.typeModifiers
      .map((entry) => {
        // eslint-disable-next-line sonarjs/super-linear-regex -- optional prefix is bounded by [^\]] so catastrophic backtracking cannot occur
        const [, modifier] = entry.match(/\[\[(?:[^\\\]]+\|)?([^\]]*)\]\]/) ?? [];
        return modifier;
      })
      .filter(Boolean);
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
  if (Array.isArray(metadata.validation)) {
    for (const rule of metadata.validation) {
      validations.push({ name, message: rule.message, conditions: rule.conditions });
    }
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
  const configOptions = [`export const options = [`];
  for (const name of sortedOptionNames) {
    configOptions.push(` {`);
    const option = options[name];
    for (const [key, value] of Object.entries(option)) {
      if (value === undefined) {
        // eslint-disable-next-line unicorn/no-break-in-nested-loop -- helper function
        continue;
      }
      if (key === 'default') {
        configOptions.push(`    ${key}: ${value},`);
      } else if (key === 'multiple') {
        if (value) {
          configOptions.push(`    multiple: true,`);
        }
      } else if (key === 'browserExposed') {
        if (value) {
          configOptions.push(`    browserExposed: true,`);
        }
      } else if (key === 'batchForwarded') {
        if (value) {
          configOptions.push(`    batchForwarded: true,`);
        }
      } else if (key === 'typeModifiers') {
        configOptions.push(`    typeModifiers: new Set(${JSON.stringify(value).replaceAll('"', "'")} as const),`);
      } else {
        configOptions.push(`    ${key}: '${value}',`);
      }
    }
    configOptions.push(` },`);
  }
  configOptions.push(`] as const;

export const defaults = {`);
  for (const [key, value] of Object.entries(defaults)) {
    configOptions.push(`    ${key}: ${value},`);
  }
  configOptions.push(`} as const;`);

  await writeFile('./src/configuration/options.ts', configOptions.join('\n'));

  const agentConfig = ['export type Configuration = {'];
  for (const name of sortedOptionNames) {
    const option = options[name];
    if (option.browserExposed) {
      const type = {
        browser: 'string',
        integer: 'number',
        timeout: 'number'
      }[option.type];
      if (!type) {
        throw new Error(`Missing TypeScript type mapping for ${option.type}`);
      }
      agentConfig.push(`  ${name}: ${type};`);
    }
  }
  agentConfig.push('};');

  await writeFile('./src/agent/Configuration.ts', agentConfig.join('\n'));

  const validationsOutput = [
    `import { punyexpr } from 'punyexpr';`,
    `import type { Configuration } from './Configuration.js';`,
    `import { indexedOptions } from './indexedOptions.js';`,
    `import { OptionValidationError } from './OptionValidationError.js';`,
    ``,
    `export const validations: Array<(configuration: Configuration) => void> = [`
  ];
  for (const { name, message, conditions } of validations) {
    const checks = conditions.map((check) => `(${check})`).join(' && ');
    validationsOutput.push(
      ` (configuration) => {`,
      `  if (Object.hasOwn(configuration, ${JSON.stringify(name)})) {`,
      `   if (!punyexpr(${JSON.stringify(checks)})(configuration)) {`,
      `    throw OptionValidationError.createValidationError(indexedOptions.${name}, ${JSON.stringify(message)});`,
      `   }`,
      `  }`,
      ` },`
    );
  }
  validationsOutput.push(`];`);

  await writeFile('./src/configuration/validations.ts', validationsOutput.join('\n'));

  const optionsMarkdown = ['|Option|CLI arg|CLI shorcut|Type|Description|', '|---|---|---|---|---|'];
  const toKebabCase = (name) => name.replaceAll(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  for (const name of sortedOptionNames) {
    const option = options[name];
    optionsMarkdown.push(
      `|[${option.name}](options/${option.name}.md)|--${toKebabCase(option.name)}|${option.short ? '-' + option.short : ''}|${option.type}|${option.description}|`
    );
  }

  await writeFile('./docs/options.md', optionsMarkdown.join('\n'));
}
