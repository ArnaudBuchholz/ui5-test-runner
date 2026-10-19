import { logger } from '../platform/index.js';
import type { Configuration } from '../configuration/Configuration.js';
import type { CommonTestReport, CTRFTest } from '../types/CommonTestReportFormat.js';

const PASSED_COUNT_WIDTH = 3;

type PageSummary = {
  url: string;
  passed: number;
  skipped: number;
  total: number;
  isOpa: boolean;
  failures: CTRFTest[];
};

/**
 * Resolve the page URL a test belongs to. `test.suite[0]` can be the *testsuite* URL (pages reached
 * through a suite are prefixed with it by `TestReportBuilder.addSuite`), and the trailing suite
 * entries are QUnit module names, not URLs. The real page is therefore the deepest suite entry that
 * parses as an http(s) URL; fall back to the first entry when none do.
 */
const pageUrlOf = (test: CTRFTest): string => {
  const suite: readonly string[] = test.suite ?? [];
  for (let index = suite.length - 1; index >= 0; --index) {
    const entry = suite[index]!;
    try {
      const { protocol } = new URL(entry);
      if (protocol === 'http:' || protocol === 'https:') {
        return entry;
      }
    } catch {
      // not a URL, keep looking up the chain
    }
  }
  return suite[0] ?? test.name;
};

const moduleOf = (test: CTRFTest, pageUrl: string): string => {
  const suite: readonly string[] = test.suite ?? [];
  const pageIndex = suite.lastIndexOf(pageUrl);
  const tail = pageIndex === -1 ? suite : suite.slice(pageIndex + 1);
  return tail.join(' ▶ ');
};

const groupByPage = (tests: readonly CTRFTest[]): PageSummary[] => {
  const pages = new Map<string, PageSummary>();
  for (const test of tests) {
    const url = pageUrlOf(test);
    let page = pages.get(url);
    if (page === undefined) {
      page = { url, passed: 0, skipped: 0, total: 0, isOpa: false, failures: [] };
      pages.set(url, page);
    }
    ++page.total;
    if (test.status === 'passed') {
      ++page.passed;
    } else if (test.status === 'failed') {
      page.failures.push(test);
    } else if (test.status === 'skipped' || test.status === 'pending') {
      ++page.skipped;
    }
    if ((test.extra as { type?: string } | undefined)?.type === 'opa') {
      page.isOpa = true;
    }
  }
  return pages.values().toArray();
};

const reportFailures = (page: PageSummary): void => {
  // OPA errors cascade; later ones are usually noise, so only the first is actionable (v5 behaviour).
  const shown = page.isOpa ? page.failures.slice(0, 1) : page.failures;
  for (const test of shown) {
    const module = moduleOf(test, page.url);
    let message = `[${page.url}]\n` + (module ? `${module} ▶ ${test.name}` : test.name);
    if (test.message) {
      message += `\n  ${test.message}`;
    }
    if (test.trace) {
      message += `\n  ${test.trace}`;
    }
    logger.error({ source: 'job', message });
  }
  if (page.isOpa && page.failures.length > 1) {
    logger.warn({
      source: 'job',
      message: `[${page.url}]\n${page.failures.length} failures; showing first OPA error only`
    });
  }
};

const statusOf = (page: PageSummary): string => {
  if (page.failures.length > 0) {
    return 'FAIL';
  }
  // No passes but something was skipped/pending: nothing actually ran to green.
  return page.passed === 0 && page.skipped > 0 ? 'SKIP' : 'PASS';
};

export function generateTextReport(_configuration: Configuration, report: CommonTestReport): void {
  const pages = groupByPage(report.results.tests);
  if (pages.length === 0) {
    return;
  }

  logger.info({ source: 'job', message: 'Test report:' });
  for (const page of pages) {
    const ratio = `${page.passed.toString().padStart(PASSED_COUNT_WIDTH, ' ')}/${page.total}`;
    logger.info({ source: 'job', message: `${statusOf(page)} ${ratio}  ${page.url}` });
  }

  if (report.results.summary.failed > 0) {
    for (const page of pages) {
      if (page.failures.length > 0) {
        reportFailures(page);
      }
    }
  }
}
