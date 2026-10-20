import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../platform/index.js';
import type { Configuration } from '../configuration/Configuration.js';
import type { CommonTestReport, CTRFTest } from '../types/CommonTestReportFormat.js';
import { createTestResults } from '../types/CommonTestReportFormat.js';
import { generateTextReport } from './textReport.js';

const NO_CONFIGURATION = {} as Configuration;
const PAGE_A = 'http://localhost:8080/pageA.html';
const PAGE_B = 'http://localhost:8080/pageB.html';
const TESTSUITE = 'http://localhost:8080/testsuite.qunit.html';

const buildReport = (tests: Array<Partial<CTRFTest>>): CommonTestReport => ({
  reportFormat: 'CTRF',
  specVersion: 'pre-1.0',
  results: createTestResults({ tool: { name: 'QUnit' }, tests })
});

/** All the plain-text lines emitted through logger.info, in order. */
const emittedLines = (): string[] => vi.mocked(logger.info).mock.calls.map(([attributes]) => attributes.message ?? '');

/** Each failure is emitted as a single (multi-line) logger.error record; return those messages. */
const errorMessages = (): string[] =>
  vi.mocked(logger.error).mock.calls.map(([attributes]) => attributes.message ?? '');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generateTextReport()', () => {
  it('emits nothing when there are no tests', () => {
    generateTextReport(NO_CONFIGURATION, buildReport([]));
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('emits only the summary section when everything passes', () => {
    const report = buildReport([
      { suite: [PAGE_A], name: 'test 1', status: 'passed' },
      { suite: [PAGE_A], name: 'test 2', status: 'passed' }
    ]);
    generateTextReport(NO_CONFIGURATION, report);
    const lines = emittedLines();
    expect(lines).toContain('Test report:');
    expect(lines).toContain(`PASS   2/2  ${PAGE_A}`);
    // No failure detail section (no `[url]` block).
    expect(lines.some((line) => line.startsWith('['))).toBe(false);
  });

  it('marks failing pages and lists their failures', () => {
    const report = buildReport([
      { suite: [PAGE_A], name: 'ok', status: 'passed' },
      { suite: [PAGE_A, 'Module X'], name: 'broken', status: 'failed', message: 'expected 1 but got 2' },
      { suite: [PAGE_B], name: 'fine', status: 'passed' }
    ]);
    generateTextReport(NO_CONFIGURATION, report);
    const lines = emittedLines();
    expect(lines).toContain(`FAIL   1/2  ${PAGE_A}`);
    expect(lines).toContain(`PASS   1/1  ${PAGE_B}`);
    // The failure detail is a single multi-line error record scoped to its page.
    const errors = errorMessages();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe(`[${PAGE_A}]\nModule X ▶ broken\n  expected 1 but got 2`);
    // The passing page produces no detail record.
    expect(errors[0]).not.toContain(PAGE_B);
  });

  it('groups by the deepest http(s) URL, not the testsuite prefix in suite[0]', () => {
    const report = buildReport([
      { suite: [TESTSUITE, PAGE_A, 'Module'], name: 'broken', status: 'failed', message: 'boom' }
    ]);
    generateTextReport(NO_CONFIGURATION, report);
    expect(emittedLines()).toContain(`FAIL   0/1  ${PAGE_A}`);
    expect(emittedLines()).not.toContain(`FAIL   0/1  ${TESTSUITE}`);
    // The failure record is headed by the page URL and uses the module segment below it.
    expect(errorMessages()[0]).toBe(`[${PAGE_A}]\nModule ▶ broken\n  boom`);
  });

  it('shows only the first failure for OPA pages and notes the remainder', () => {
    const report = buildReport([
      { suite: [PAGE_A], name: 'first opa error', status: 'failed', message: 'A', extra: { type: 'opa' } },
      { suite: [PAGE_A], name: 'second opa error', status: 'failed', message: 'B', extra: { type: 'opa' } },
      { suite: [PAGE_A], name: 'third opa error', status: 'failed', message: 'C', extra: { type: 'opa' } }
    ]);
    generateTextReport(NO_CONFIGURATION, report);
    const errors = errorMessages();
    // Only the first OPA failure is detailed.
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('first opa error');
    expect(errors[0]).not.toContain('second opa error');
    // The "focus on first error" caveat is surfaced as a page-scoped warning.
    expect(logger.warn).toHaveBeenCalledWith({
      source: 'job',
      message: `[${PAGE_A}]\n3 failures; showing first OPA error only`
    });
  });

  it('labels a page whose tests were all skipped as SKIP, not PASS', () => {
    const report = buildReport([{ suite: ['Remote JS Jest'], name: 'skipped test', status: 'skipped' }]);
    generateTextReport(NO_CONFIGURATION, report);
    const lines = emittedLines();
    expect(lines).toContain('SKIP   0/1  Remote JS Jest');
    expect(lines).not.toContain('PASS   0/1  Remote JS Jest');
  });

  it('labels a page as PASS when at least one test passed alongside skips', () => {
    const report = buildReport([
      { suite: [PAGE_A], name: 'ran', status: 'passed' },
      { suite: [PAGE_A], name: 'skipped', status: 'skipped' }
    ]);
    generateTextReport(NO_CONFIGURATION, report);
    expect(emittedLines()).toContain(`PASS   1/2  ${PAGE_A}`);
  });

  it('labels a page as FAIL even when it also has skips', () => {
    const report = buildReport([
      { suite: [PAGE_A], name: 'broken', status: 'failed', message: 'boom' },
      { suite: [PAGE_A], name: 'skipped', status: 'skipped' }
    ]);
    generateTextReport(NO_CONFIGURATION, report);
    expect(emittedLines()).toContain(`FAIL   0/2  ${PAGE_A}`);
  });

  it('includes the trace in the failure detail when present', () => {
    const report = buildReport([
      {
        suite: [PAGE_A],
        name: 'broken',
        status: 'failed',
        message: 'expected 1',
        trace: 'at Object.<anonymous> (test.js:1:1)'
      }
    ]);
    generateTextReport(NO_CONFIGURATION, report);
    expect(errorMessages()[0]).toBe(`[${PAGE_A}]\nbroken\n  expected 1\n  at Object.<anonymous> (test.js:1:1)`);
  });

  it('surfaces a synthetic page-level failure (page did not render)', () => {
    const report = buildReport([
      {
        suite: [PAGE_A],
        name: PAGE_A,
        status: 'failed',
        message: 'An error occurred while fetching the URL, check the logs'
      }
    ]);
    generateTextReport(NO_CONFIGURATION, report);
    expect(emittedLines()).toContain(`FAIL   0/1  ${PAGE_A}`);
    expect(errorMessages()[0]).toBe(
      `[${PAGE_A}]\n${PAGE_A}\n  An error occurred while fetching the URL, check the logs`
    );
  });
});
