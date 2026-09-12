import { it, expect, vi, beforeEach } from 'vitest';
import { help } from './help.js';
import { options } from '../configuration/options.js';
import { Terminal } from '../platform/index.js';
import { Npm } from '../Npm.js';
import { toKebabCase } from '../utils/shared/string.js';
import { version } from '../platform/version.js';

const PACKAGE_NAME = 'ui5-test-runner';
const PACKAGE_VERSION = '1.2.3';

beforeEach(() => {
  vi.mocked(version).mockResolvedValue({ name: PACKAGE_NAME, version: PACKAGE_VERSION });
  vi.spyOn(Npm, 'getLatestVersion').mockResolvedValue(PACKAGE_VERSION);
});

it('outputs version header', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  await help();
  expect(log).toHaveBeenCalledWith(`${PACKAGE_NAME}@${PACKAGE_VERSION}`);
  log.mockRestore();
});

it('outputs update notice when a newer version is available', async () => {
  vi.mocked(version).mockResolvedValue({ name: PACKAGE_NAME, version: PACKAGE_VERSION });
  vi.spyOn(Npm, 'getLatestVersion').mockResolvedValue('2.0.0');
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  await help();
  expect(log).toHaveBeenCalledWith(`Latest version of ${PACKAGE_NAME} is 2.0.0`);
  log.mockRestore();
});

it('skips update notice when version check fails', async () => {
  vi.spyOn(Npm, 'getLatestVersion').mockRejectedValue(new Error('network error'));
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  await help();
  expect(log).not.toHaveBeenCalledWith(expect.stringContaining('Latest version'));
  log.mockRestore();
});

it('outputs usage line', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  await help();
  expect(log).toHaveBeenCalledWith('Usage: ui5-test-runner [options]\n');
  log.mockRestore();
});

it('outputs a line for every option', async () => {
  const lines: string[] = [];
  const log = vi.spyOn(console, 'log').mockImplementation((line: string) => {
    lines.push(line);
  });
  await help();
  log.mockRestore();
  for (const option of options) {
    expect(lines.some((line) => line.includes(`--${toKebabCase(option.name)}`))).toBe(true);
  }
});

it('includes short alias when present', async () => {
  const lines: string[] = [];
  const log = vi.spyOn(console, 'log').mockImplementation((line: string) => {
    lines.push(line);
  });
  await help();
  log.mockRestore();
  const cwdLine = lines.find((line) => line.includes('--cwd'));
  expect(cwdLine).toContain('-c');
});

it('marks multiple-value options with ellipsis', async () => {
  const lines: string[] = [];
  const log = vi.spyOn(console, 'log').mockImplementation((line: string) => {
    lines.push(line);
  });
  await help();
  log.mockRestore();
  const batchLine = lines.find((line) => line.includes('--batch'));
  expect(batchLine).toContain('<string...>');
});

it('includes default value when defined', async () => {
  const lines: string[] = [];
  const log = vi.spyOn(console, 'log').mockImplementation((line: string) => {
    lines.push(line);
  });
  await help();
  log.mockRestore();
  const allOutput = lines.join('\n');
  expect(allOutput).toContain('--browser,');
  expect(allOutput).toContain('puppeteer');
});

it('omits default for options without one', async () => {
  const lines: string[] = [];
  const log = vi.spyOn(console, 'log').mockImplementation((line: string) => {
    lines.push(line);
  });
  await help();
  log.mockRestore();
  const urlLine = lines.find((line) => line.includes('--url,'));
  expect(urlLine).not.toContain('[default:');
});

it('outputs the documentation URL', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  await help();
  expect(log).toHaveBeenCalledWith('\nFor full documentation, visit https://arnaudbuchholz.github.io/ui5-test-runner/');
  log.mockRestore();
});

it('wraps description at terminal width', async () => {
  const WIDTH = 80;
  const widthSpy = vi.spyOn(Terminal, 'width', 'get').mockReturnValue(WIDTH);
  const lines: string[] = [];
  const log = vi.spyOn(console, 'log').mockImplementation((line: string) => {
    lines.push(line);
  });
  await help();
  log.mockRestore();
  widthSpy.mockRestore();
  const optionLines = lines.filter((line) => line.startsWith('  --'));
  for (const line of optionLines) {
    for (const segment of line.split('\n')) {
      expect(segment.length).toBeLessThanOrEqual(WIDTH);
    }
  }
});
