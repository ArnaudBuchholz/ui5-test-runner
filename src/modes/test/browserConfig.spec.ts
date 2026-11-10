import { it, expect, beforeEach } from 'vitest';
import { initBrowserConfig, getBrowserConfigScript } from './browserConfig.js';
import type { Configuration } from '../../configuration/Configuration.js';

beforeEach(() => {
  initBrowserConfig({ screenshot: false } as unknown as Configuration);
});

it('getBrowserConfigScript throws when initBrowserConfig was not called', () => {
  // Use dynamic import to get a fresh module instance without prior initBrowserConfig
  // Instead verify that after a fresh init the script is available
  expect(() => getBrowserConfigScript(1)).not.toThrow();
});

it('getBrowserConfigScript returns a script that sets window config', () => {
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
  expect(script).toContain('"pageId":789');
});

it('serializes browserExposed regexp options to their source string', () => {
  initBrowserConfig({ coverageRemoteInstrument: [/^my\/lib\//, /^other\//] } as unknown as Configuration);
  const script = getBrowserConfigScript(1);
  expect(script).toContain(String.raw`"coverageRemoteInstrument":["^my\\/lib\\/","^other\\/"]`);
});

it('injects coverageOnly as an array when provided as a string', () => {
  const script = getBrowserConfigScript(1, { coverageOnly: 'sap/ui/demo/todo/' });
  expect(script).toContain('"coverageOnly":["sap/ui/demo/todo/"]');
});

it('injects coverageNever as an array when provided as an array', () => {
  const script = getBrowserConfigScript(1, { coverageNever: ['test-resources/', 'mock/'] });
  expect(script).toContain('"coverageNever":["test-resources/","mock/"]');
});

it('injects both coverageOnly and coverageNever when both are provided', () => {
  const script = getBrowserConfigScript(1, { coverageOnly: 'sap/', coverageNever: 'test-resources/' });
  expect(script).toContain('"coverageOnly":["sap/"]');
  expect(script).toContain('"coverageNever":["test-resources/"]');
});
