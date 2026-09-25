import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const OPTIONS_FOLDER = 'docs/options';

// Types allowed for batchForwarded: forwarding re-serializes the value to a CLI string and the child
// re-parses it, so only types that round-trip back to a valid CLI argument qualify. library-mapping
// (and any object type) is excluded — it stringifies to `[object Object]`. fs-entry and regexp are
// borderline (fs-entry loses relative paths; regexp round-trips only incidentally), so don't add new
// types without settling their serialization. Multiple-valued options are rejected regardless of type.
const BATCH_FORWARDABLE_TYPES = new Set([
  'boolean',
  'enumeration',
  'fs-entry',
  'integer',
  'json',
  'percent',
  'regexp',
  'string',
  'timeout',
  'url'
]);

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
  if (metadata['#type'] !== 'option') {
    continue;
  }
  const name = fileName.split('.md', 1)[0];
  const errors = [];
  const short = metadata.short ? String(metadata.short) : undefined;
  if (checkIfDuplicate(name, short)) {
    errors.push(`duplicate name / short detected: ${name} ${short ?? ''}`);
  }
  const type = metadata.type === undefined ? undefined : String(metadata.type);
  if (!type || !types.includes(type)) {
    errors.push(`Unknown type ${metadata.type}`);
  }
  const defaultValue = metadata.default === undefined ? undefined : String(metadata.default);
  const summary = metadata.summary;
  const isMultiple = metadata.multiple === 'yes' || metadata.multiple === true;
  const isBrowserExposed = metadata.browserExposed === 'yes' || metadata.browserExposed === true;
  const isBatchForwarded = metadata.batchForwarded === 'yes' || metadata.batchForwarded === true;
  if (isBatchForwarded) {
    if (isMultiple) {
      errors.push(`batchForwarded is not allowed on a multiple option (${name})`);
    }
    if (type && !BATCH_FORWARDABLE_TYPES.has(type)) {
      errors.push(`batchForwarded is not allowed on type '${type}' (${name})`);
    }
  }
  if (defaultValue) {
    defaults[name] = defaultValue;
  }
  let typeModifiers;
  if (Array.isArray(metadata.typeModifiers)) {
    typeModifiers = metadata.typeModifiers.map(String).filter(Boolean);
  }
  if (errors.length > 0) {
    console.error(`❌ ${fileName} :\n\t` + errors.join('\n\t'));
    process.exitCode = 1;
  }
  const defaultLabel = metadata.defaultLabel === undefined ? undefined : String(metadata.defaultLabel);
  options[name] = {
    name,
    short,
    type,
    typeModifiers,
    multiple: isMultiple,
    browserExposed: isBrowserExposed,
    batchForwarded: isBatchForwarded,
    description: summary,
    defaultLabel,
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
    if (!option.browserExposed) {
      continue;
    }
    const type = {
      boolean: 'boolean',
      browser: 'string',
      enumeration: 'string',
      integer: 'number',
      timeout: 'number'
    }[option.type];
    if (!type) {
      throw new Error(`Missing TypeScript type mapping for ${option.type}`);
    }
    agentConfig.push(`  ${name}: ${type};`);
  }
  agentConfig.push('  pageId: number;', '};');

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
    const typeDisplay =
      option.type === 'enumeration' && option.typeModifiers ? option.typeModifiers.join(String.raw` \| `) : option.type;
    optionsMarkdown.push(
      `|[${option.name}](options/${option.name}.md)|--${toKebabCase(option.name)}|${option.short ? '-' + option.short : ''}|${typeDisplay}|${option.description}|`
    );
  }

  await writeFile('./docs/options.md', optionsMarkdown.join('\n'));
}
