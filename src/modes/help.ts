import { options } from '../configuration/options.js';
import { Terminal } from '../platform/index.js';
import { version } from '../platform/version.js';
import { Npm } from '../Npm.js';
import { toKebabCase } from '../utils/shared/string.js';

const FALLBACK_WIDTH = 80;

const formatDefault = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value);
};

const wrapText = (text: string, width: number, indent: string): string => {
  if (width <= 0) {
    return text;
  }
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= width) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current.length > 0) {
    lines.push(current);
  }
  return lines.join(`\n${indent}`);
};

const optionFlags = (option: (typeof options)[number]): string => {
  const short = 'short' in option ? option.short : undefined;
  const kebab = toKebabCase(option.name);
  return short ? `--${kebab}, -${short}` : `--${kebab}`;
};

const optionTypeLabel = (option: (typeof options)[number]): string => {
  const isMultiple = 'multiple' in option && option.multiple;
  return isMultiple ? `<${option.type}...>` : `<${option.type}>`;
};

export const help = async () => {
  const { name, version: semver } = await version();
  console.log(`${name}@${semver}`);
  let latestVersion: string | undefined;
  try {
    latestVersion = await Npm.getLatestVersion(name);
  } catch {
    // ignore
  }
  if (latestVersion !== undefined && latestVersion !== semver) {
    console.log(`Latest version of ${name} is ${latestVersion}`);
  }
  console.log('');
  console.log('Usage: ui5-test-runner [options]\n');
  console.log('Options:\n');

  const col1Width = Math.max(...options.map((option) => optionFlags(option).length));
  const col2Width = Math.max(...options.map((option) => optionTypeLabel(option).length));

  const terminalWidth = Terminal.width || FALLBACK_WIDTH;
  // 2 (leading spaces) + col1 + 2 (gap) + col2 + 2 (gap)
  const descIndentWidth = 2 + col1Width + 2 + col2Width + 2;
  const descWidth = terminalWidth - descIndentWidth;
  const descIndent = ' '.repeat(descIndentWidth);

  for (const option of options) {
    const flags = optionFlags(option);
    const typeLabel = optionTypeLabel(option);
    const defaultPart = 'default' in option ? ` [default: ${formatDefault(option.default)}]` : '';
    const desc = wrapText(`${option.description}${defaultPart}`, descWidth, descIndent);
    console.log(`  ${flags.padEnd(col1Width)}  ${typeLabel.padEnd(col2Width)}  ${desc}`);
  }

  console.log('\nFor full documentation, visit https://arnaudbuchholz.github.io/ui5-test-runner/');
};
