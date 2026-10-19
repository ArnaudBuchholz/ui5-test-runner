import { it, expect, beforeEach, vi } from 'vitest';
import { Terminal } from '../../index.js';
import { LlmLoggerOutput } from './LlmLoggerOutput.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import type { InternalLogAttributes } from '../types.js';
import { LogLevel } from '../types.js';

vi.useFakeTimers();
vi.setSystemTime(new Date('2025-12-12T00:00:00.000Z'));
beforeEach(() => vi.clearAllMocks());

const REPORT_DIR = './tmp';

const build = () => new LlmLoggerOutput({ reportDir: REPORT_DIR, outputInterval: 250 } as Configuration, Date.now());

const terminalWrites = () => vi.mocked(Terminal.write).mock.calls.map(([text]) => text);

it('does not emit a periodic progress heartbeat', async () => {
  const output = build();
  output.addAttributesToLoggerOutput({
    timestamp: Date.now(),
    source: 'progress',
    level: LogLevel.info,
    message: 'page',
    pageId: 1,
    data: { value: 1, max: 10 }
  } as InternalLogAttributes);
  vi.clearAllMocks();
  await vi.advanceTimersByTimeAsync(1000);
  expect(Terminal.write).not.toHaveBeenCalled();
});

it('suppresses per-page lifecycle lines from the terminal but keeps them in the report file', () => {
  const output = build();
  const addToReport = vi.spyOn(output, 'addToReport');
  output.addAttributesToLoggerOutput({
    timestamp: Date.now(),
    source: 'progress',
    level: LogLevel.info,
    message: 'page',
    pageId: 1,
    data: { value: 3, max: 10, errors: 1, type: 'qunit' }
  } as InternalLogAttributes);
  // No ">>" open line reaches the terminal
  expect(Terminal.write).not.toHaveBeenCalled();
  // ...but the lifecycle line is still persisted to output.txt
  expect(addToReport).toHaveBeenCalledWith(expect.stringContaining('>> page [1]'));
  // Bookkeeping still happened
  expect(output.overallProgress.totalNumberOfExecutedTests).toBe(3);
  expect(output.overallProgress.totalNumberOfErrors).toBe(1);
});

it('annotates event lines with source and pageId, free of ANSI codes and elapsed timestamp', () => {
  const output = build();
  output.addAttributesToLoggerOutput({
    timestamp: Date.now() + 154_000, // 02:34 after start — must NOT appear
    source: 'page',
    level: LogLevel.error,
    message: 'navigation failed',
    pageId: 2
  } as InternalLogAttributes);
  const [line] = terminalWrites();
  expect(line).toContain('[page#2]');
  expect(line).toContain('navigation failed');
  // The elapsed-since-start timestamp is dropped on the LLM path
  expect(line).not.toContain('02:34');
  // No ANSI escapes remain: stripping is a no-op
  expect(line).toStrictEqual(Terminal.stripVTControlCharacters(line!));
});

it('omits the pageId when the event is not page-scoped', () => {
  const output = build();
  output.addAttributesToLoggerOutput({
    timestamp: Date.now(),
    source: 'server',
    level: LogLevel.warn,
    message: 'port busy'
  } as InternalLogAttributes);
  const [line] = terminalWrites();
  expect(line).toContain('[server] WARN port busy');
  expect(line).not.toContain('#');
});

it('prefixes a severity word for warn and above, and appends the error', () => {
  const output = build();
  output.addAttributesToLoggerOutput({
    timestamp: Date.now(),
    source: 'assert',
    level: LogLevel.error,
    message: 'assertion failed',
    error: new TypeError('x is not a function')
  } as InternalLogAttributes);
  const [line] = terminalWrites();
  expect(line).toContain('[assert] ERROR assertion failed TypeError: x is not a function');
});

it('does not prefix a severity word for info lines', () => {
  const output = build();
  output.addAttributesToLoggerOutput({
    timestamp: Date.now(),
    source: 'job',
    level: LogLevel.info,
    message: 'tests completed'
  } as InternalLogAttributes);
  const [line] = terminalWrites();
  expect(line).toStrictEqual('[job] tests completed\n');
});

it('does not render filtered sources or debug records', () => {
  const output = build();
  output.addAttributesToLoggerOutput({
    timestamp: Date.now(),
    source: 'browser/network',
    level: LogLevel.info,
    message: 'GET /foo',
    pageId: 1
  } as InternalLogAttributes);
  output.addAttributesToLoggerOutput({
    timestamp: Date.now(),
    source: 'job',
    level: LogLevel.debug,
    message: 'internal detail'
  } as InternalLogAttributes);
  expect(Terminal.write).not.toHaveBeenCalled();
});

it('writes nothing on close — the trace path and counts are emitted as `job` logs', () => {
  const output = build();
  vi.clearAllMocks();
  output.closeLoggerOutput();
  expect(Terminal.write).not.toHaveBeenCalled();
});
