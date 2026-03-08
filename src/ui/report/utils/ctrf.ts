import type { CommonTestReport, CommonTestStatus } from '../../../src/types/CommonTestReportFormat.js';
import type { SuiteNode } from '../types.js';

interface RawTest {
  status: CommonTestStatus;
  suite?: string | readonly string[];
  name: string;
  duration: number;
  message?: string;
  trace?: string;
}

export function validateCtrf(json: unknown): json is CommonTestReport {
  if (!json || typeof json !== 'object') {
    return false;
  }
  const report = json as Record<string, unknown>;
  if (report.reportFormat !== 'CTRF') {
    return false;
  }
  const results = report.results as Record<string, unknown> | undefined;
  if (!results?.summary || !Array.isArray(results.tests)) {
    return false;
  }

  const summary = results.summary as Record<string, unknown>;
  const requiredSummary = ['tests', 'passed', 'failed', 'skipped', 'start', 'stop', 'duration'];
  for (const key of requiredSummary) {
    if (typeof summary[key] !== 'number') {
      return false;
    }
  }

  return true;
}

export function prettifyUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const parts = parsedUrl.pathname.split('/');
    let name = parts.at(-1);
    if (!name && parts.length > 1) {
      name = parts.at(-2);
    }
    const testParameter = parsedUrl.searchParams.get('test');
    if (testParameter) {
      name += ` (${testParameter})`;
    }
    return name || url;
  } catch {
    return url;
  }
}

function getSuites(test: RawTest): string[] {
  const { suite } = test;
  if (Array.isArray(suite)) {
    return [...(suite as string[])];
  }
  if (suite) {
    return [suite as string];
  }
  return [];
}

function addSuiteToHierarchy(root: SuiteNode, suites: string[]) {
  let current = root;
  let fullPath = '';
  for (const suite of suites) {
    fullPath = fullPath ? `${fullPath} > ${suite}` : suite;
    if (!current.children.has(suite)) {
      current.children.set(suite, {
        name: isUrl(suite) ? prettifyUrl(suite) : suite,
        fullName: fullPath,
        children: new Map()
      });
    }
    current = current.children.get(suite)!;
  }
}

export function buildSuiteHierarchy(tests: RawTest[]): SuiteNode {
  const root: SuiteNode = { name: 'Root', fullName: '', children: new Map() };

  for (const test of tests) {
    const suites = getSuites(test);

    if (suites.length === 0) {
      if (!root.children.has('No suite')) {
        root.children.set('No suite', { name: 'No suite', fullName: 'No suite', children: new Map() });
      }
      continue;
    }

    addSuiteToHierarchy(root, suites);
  }

  return root;
}

function isUrl(string_: string): boolean {
  try {
    new URL(string_);
    return true;
  } catch {
    return false;
  }
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

export function formatTimestamp(timestamp: string | undefined): string {
  if (!timestamp) {
    return 'N/A';
  }
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return 'N/A';
  }
}
