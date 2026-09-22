import { it, expect, afterEach } from 'vitest';
import { Host } from '../platform/index.js';
import { getExtraChromeArguments } from './chromeArguments.js';

const ENV_KEY = 'UI5TR_CHROME_ARGS';

afterEach(() => {
  delete (Host.env as Record<string, string | undefined>)[ENV_KEY];
});

it('returns an empty list when UI5TR_CHROME_ARGS is unset', () => {
  expect(getExtraChromeArguments()).toEqual([]);
});

it('returns a single argument', () => {
  (Host.env as Record<string, string | undefined>)[ENV_KEY] = '--no-sandbox';
  expect(getExtraChromeArguments()).toEqual(['--no-sandbox']);
});

it('splits multiple whitespace-separated arguments', () => {
  (Host.env as Record<string, string | undefined>)[ENV_KEY] = '--no-sandbox --disable-setuid-sandbox';
  expect(getExtraChromeArguments()).toEqual(['--no-sandbox', '--disable-setuid-sandbox']);
});

it('drops empty entries from surrounding and repeated whitespace', () => {
  (Host.env as Record<string, string | undefined>)[ENV_KEY] = '  --a   --b  ';
  expect(getExtraChromeArguments()).toEqual(['--a', '--b']);
});
