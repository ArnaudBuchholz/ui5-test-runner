import { it, expect, beforeEach } from 'vitest';
import { Host } from '../platform/index.js';
import { buildChromeLaunchOptions, DEFAULT_CHROME_ARGS } from './chromeOptions.js';

const ENV_KEY = 'UI5TR_CHROME_ARGS';

beforeEach(() => {
  delete (Host.env as Record<string, string | undefined>)[ENV_KEY];
});

it('includes default background-throttling flags when options is undefined', () => {
  expect(buildChromeLaunchOptions(undefined)).toEqual({ args: DEFAULT_CHROME_ARGS });
});

it('places default flags before extra, user, and env args', () => {
  (Host.env as Record<string, string | undefined>)[ENV_KEY] = '--env-flag';
  const result = buildChromeLaunchOptions({ args: ['--user-flag'] }, ['--extra']);
  expect(result.args).toEqual([...DEFAULT_CHROME_ARGS, '--extra', '--user-flag', '--env-flag']);
});

it('filters non-string values from args', () => {
  const result = buildChromeLaunchOptions({ args: ['--valid', 42, null, '--also-valid'] });
  expect(result.args).toEqual([...DEFAULT_CHROME_ARGS, '--valid', '--also-valid']);
});

it('sets ignoreDefaultArgs to true when given true', () => {
  const result = buildChromeLaunchOptions({ ignoreDefaultArgs: true });
  expect(result.ignoreDefaultArgs).toBe(true);
});

it('sets ignoreDefaultArgs to filtered string array when given an array', () => {
  const result = buildChromeLaunchOptions({ ignoreDefaultArgs: ['--enable-automation', 99] });
  expect(result.ignoreDefaultArgs).toEqual(['--enable-automation']);
});

it('omits ignoreDefaultArgs when not set in options', () => {
  const result = buildChromeLaunchOptions({});
  expect(result).not.toHaveProperty('ignoreDefaultArgs');
});

it('excludes env args when includeEnvArgs is false', () => {
  (Host.env as Record<string, string | undefined>)[ENV_KEY] = '--env-flag';
  const result = buildChromeLaunchOptions({ args: ['--user-flag'] }, [], false);
  expect(result.args).toEqual([...DEFAULT_CHROME_ARGS, '--user-flag']);
});
