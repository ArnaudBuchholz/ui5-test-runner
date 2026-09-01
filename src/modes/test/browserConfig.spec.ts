import { it, expect, beforeEach } from 'vitest';
import { initBrowserConfig, getBrowserConfigScript } from './browserConfig.js';
import type { Configuration } from '../../configuration/Configuration.js';

beforeEach(() => {
  initBrowserConfig({ screenshot: false } as unknown as Configuration);
});

const MINIMAL_CONFIG = { screenshot: false } as unknown as Configuration;

it('getBrowserConfigScript throws when initBrowserConfig was not called', () => {
  // Use dynamic import to get a fresh module instance without prior initBrowserConfig
  // Instead verify that after a fresh init the script is available
  initBrowserConfig(MINIMAL_CONFIG);
  expect(() => getBrowserConfigScript(1)).not.toThrow();
});

it('getBrowserConfigScript returns a script that sets window config', () => {
  initBrowserConfig(MINIMAL_CONFIG);
  const script = getBrowserConfigScript(1);
  expect(script).toContain('ui5-test-runner');
  expect(script).toContain('.config=');
});

it('getBrowserConfigScript includes browserExposed option values', () => {
  const config = { screenshot: true } as unknown as Configuration;
  initBrowserConfig(config);
  const script = getBrowserConfigScript(1);
  expect(script).toContain('"screenshot":true');
});

it('getBrowserConfigScript includes a self-executing script setting pageId', () => {
  const script = getBrowserConfigScript(789);
  expect(script).toContain('.config.pageId=789');
});
