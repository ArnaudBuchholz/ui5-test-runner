import { it, expect, vi, beforeEach } from 'vitest';
import { help } from './help.js';
import { options } from '../configuration/options.js';
import { Terminal } from '../platform/index.js';
import { Npm } from '../Npm.js';
import { toKebabCase } from '../utils/shared/string.js';
import { version } from '../platform/version.js';

const PACKAGE_NAME = 'ui5-test-runner';
const PACKAGE_VERSION = '1.2.3';

const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

beforeEach(() => {
  vi.clearAllMocks();
  consoleSpy.mockImplementation(() => {});
  vi.mocked(version).mockResolvedValue({ name: PACKAGE_NAME, version: PACKAGE_VERSION });
  vi.spyOn(Npm, 'getLatestVersion').mockResolvedValue(PACKAGE_VERSION);
});

it('outputs version header', async () => {
  await help();
  expect(consoleSpy).toHaveBeenCalledWith(`${PACKAGE_NAME}@${PACKAGE_VERSION}`);
});

it('outputs update notice when a newer version is available', async () => {
  vi.mocked(version).mockResolvedValue({ name: PACKAGE_NAME, version: PACKAGE_VERSION });
  vi.spyOn(Npm, 'getLatestVersion').mockResolvedValue('2.0.0');
  await help();
  expect(consoleSpy).toHaveBeenCalledWith(`Latest version of ${PACKAGE_NAME} is 2.0.0`);
});

it('skips update notice when version check fails', async () => {
  vi.spyOn(Npm, 'getLatestVersion').mockRejectedValue(new Error('network error'));
  await help();
  expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Latest version'));
});

it('outputs usage line', async () => {
  await help();
  expect(consoleSpy).toHaveBeenCalledWith('Usage: ui5-test-runner [options]\n');
});

it('outputs a line for every option', async () => {
  await help();
  const lines = consoleSpy.mock.calls.map((c) => c[0] as string);
  for (const option of options) {
    expect(lines.some((line) => line.includes(`--${toKebabCase(option.name)}`))).toBe(true);
  }
});

it('includes short alias when present', async () => {
  await help();
  const lines = consoleSpy.mock.calls.map((c) => c[0] as string);
  const cwdLine = lines.find((line) => line.includes('--cwd'));
  expect(cwdLine).toContain('-c');
});

it('marks multiple-value options with ellipsis', async () => {
  await help();
  const lines = consoleSpy.mock.calls.map((c) => c[0] as string);
  const batchLine = lines.find((line) => line.includes('--batch'));
  expect(batchLine).toContain('<string...>');
});

it('includes default value when defined', async () => {
  await help();
  const allOutput = consoleSpy.mock.calls.map((c) => c[0] as string).join('\n');
  expect(allOutput).toContain('--browser,');
  expect(allOutput).toContain('puppeteer');
});

it('omits default for options without one', async () => {
  await help();
  const lines = consoleSpy.mock.calls.map((c) => c[0] as string);
  const urlLine = lines.find((line) => line.includes('--url,'));
  expect(urlLine).not.toContain('[default:');
});

it('outputs the documentation URL', async () => {
  await help();
  expect(consoleSpy).toHaveBeenCalledWith(
    '\nFor full documentation, visit https://arnaudbuchholz.github.io/ui5-test-runner/'
  );
});

it('wraps description at terminal width', async () => {
  const WIDTH = 80;
  const widthSpy = vi.spyOn(Terminal, 'width', 'get').mockReturnValue(WIDTH);
  await help();
  widthSpy.mockRestore();
  const optionLines = consoleSpy.mock.calls.map((c) => c[0] as string).filter((line) => line.startsWith('  --'));
  for (const line of optionLines) {
    for (const segment of line.split('\n')) {
      expect(segment.length).toBeLessThanOrEqual(WIDTH);
    }
  }
});
