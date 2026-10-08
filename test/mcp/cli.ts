import 'dotenv/config';
import { globSync } from 'node:fs';
import { join, relative } from 'node:path';
import { logger } from '../../src/platform/index.js';
import { CommandLine } from '../../src/configuration/CommandLine.js';
import { initReportBuilder } from '../../src/reports/initReportBuilder.js';
import { saveReport } from '../../src/reports/saveReport.js';
import { createTestResults  } from '../../src/types/CommonTestReportFormat.js';
import type { CTRFTest } from '../../src/types/CommonTestReportFormat.js';
import { Folder } from '../../src/utils/node/Folder.js';
import { parallelize } from '../../src/utils/shared/parallelize.js';
import { loadProvider } from './provider.js';
import { runQuery } from './query.js';
import { loadTestCase } from './testCase.js';
import { judge, JUDGE_ENV_VAR } from './judge.js';

const CASES_DIR = join('test', 'mcp', 'cases');

function parseArguments(argv: string[]): { mcpUrl: string; casePaths: string[]; runnerArgv: string[] } {
  const mcpIndex = argv.indexOf('--mcp');
  const mcpUrl = mcpIndex === -1 ? undefined : argv[mcpIndex + 1];
  if (!mcpUrl) {
    throw new Error('Usage: test:mcp --mcp <url> [runner options…] [case.toml …]');
  }
  // Tokens consumed by the harness itself: --mcp, its value, and any explicit .toml positionals.
  const harnessIndexes = new Set([mcpIndex, mcpIndex + 1]);
  const explicit: string[] = [];
  for (const [index, argument] of argv.entries()) {
    if (!argument.endsWith('.toml') || harnessIndexes.has(index)) {
      continue;
    }
    explicit.push(argument);
    harnessIndexes.add(index);
  }
  const casePaths =
    explicit.length > 0 ? explicit : globSync(join(CASES_DIR, '**', '*.toml')).toSorted((a, b) => a.localeCompare(b));
  if (casePaths.length === 0) {
    throw new Error(`No test cases found under ${CASES_DIR}`);
  }
  const runnerArgv = argv.filter((_, index) => !harnessIndexes.has(index));
  return { mcpUrl, casePaths, runnerArgv };
}

// Derives the suite hierarchy and test name from a case path (relative to the cases dir).
// e.g. migration/reportGenerator/cli.toml → { suite: ['migration', 'reportGenerator', 'cli'], name: 'cli' }
function casePartsOf(casePath: string): { suite: [string, ...string[]]; name: string } {
  const segments = relative(CASES_DIR, casePath).replace(/\.toml$/, '').split(/[/\\]/);
  return { suite: segments as [string, ...string[]], name: segments.at(-1)! };
}

const { mcpUrl, casePaths, runnerArgv } = parseArguments(process.argv.slice(2));
const isJudging = process.env[JUDGE_ENV_VAR] !== undefined;

// Validate providers up front
loadProvider();
if (isJudging) {
  loadProvider(JUDGE_ENV_VAR);
}

// Reuse the runner's full command-line parsing + validation for the leftover arguments, so
// reportDir (-r), parallel (-p), debug flags and anything else behave identically to the main
// CLI — including their defaults (reportDir defaults to 'report', parallel to 2).
const configuration = await CommandLine.buildConfigurationFrom(process.cwd(), runnerArgv);
const builder = await initReportBuilder(configuration);
await Folder.create(configuration.reportDir);
await logger.start(configuration);

const tests: CTRFTest[] = [];
let isAnyFailed = false;
let queryInputTokens = 0;
let queryOutputTokens = 0;
let judgeInputTokens = 0;
let judgeOutputTokens = 0;

interface CaseResult {
  tests: CTRFTest[];
  queryInputTokens: number;
  queryOutputTokens: number;
  judgeInputTokens: number;
  judgeOutputTokens: number;
  failed: boolean;
}

let completed = 0;

async function judgeCase(
  caseIndex: number,
  caseName: string,
  caseSuite: [string, ...string[]],
  testCase: ReturnType<typeof loadTestCase>,
  finalAnswer: string,
  started: number,
  queryIn: number,
  queryOut: number,
  result: CaseResult
): Promise<void> {
  const judged = await judge(testCase.question, finalAnswer, testCase.expected, caseIndex);
  result.judgeInputTokens = judged.inputTokens;
  result.judgeOutputTokens = judged.outputTokens;

  const tokens = {
    input: queryIn + judged.inputTokens,
    output: queryOut + judged.outputTokens,
    query: { input: queryIn, output: queryOut },
    judge: { input: judged.inputTokens, output: judged.outputTokens }
  };

  result.tests.push({
    name: '(answer)',
    status: 'passed',
    duration: Date.now() - started,
    message: testCase.question,
    trace: finalAnswer,
    suite: caseSuite,
    extra: { tokens }
  });

  for (const verdict of judged.verdicts) {
    result.tests.push({
      name: verdict.name,
      status: verdict.pass ? 'passed' : 'failed',
      duration: Date.now() - started,
      suite: caseSuite,
      message: verdict.criterion,
      trace: verdict.rationale,
      extra: { tokens }
    });
    const verdictLog = { source: 'mcp', pageId: caseIndex, message: `${caseName}: ${verdict.name} expected criteria validation` } as const;
    if (verdict.pass) {
      logger.info(verdictLog);
    } else {
      logger.error(verdictLog);
    }
    logger.debug({ source: 'mcp', pageId: caseIndex, message: `${caseName}/${verdict.name}: ${verdict.pass ? 'PASS' : 'FAIL'}`, data: { rationale: verdict.rationale } });
  }

  if (!judged.passed) {
    result.failed = true;
  }
}

async function runTestCase(casePath: string, caseIndex: number): Promise<CaseResult> {
  const { suite: caseSuite, name: caseName } = casePartsOf(casePath);
  const testCase = loadTestCase(casePath);
  const started = Date.now();
  const result: CaseResult = { tests: [], queryInputTokens: 0, queryOutputTokens: 0, judgeInputTokens: 0, judgeOutputTokens: 0, failed: false };

  logger.info({ source: 'progress', pageId: caseIndex, message: caseName, data: { value: 0, max: 2, errors: 0, type: 'unknown' } });

  try {
    const { finalAnswer, inputTokens: queryIn, outputTokens: queryOut } = await runQuery(mcpUrl, testCase, caseIndex);
    result.queryInputTokens = queryIn;
    result.queryOutputTokens = queryOut;
    logger.info({ source: 'mcp', pageId: caseIndex, message: `${caseName}: answered (${queryIn} in / ${queryOut} out tokens)` });
    logger.debug({ source: 'mcp', pageId: caseIndex, message: `${caseName}: answer`, data: { answer: finalAnswer, tokens: { input: queryIn, output: queryOut } } });
    // Answer received — case is half done (the remaining half is judging, if enabled).
    logger.info({ source: 'progress', pageId: caseIndex, message: caseName, data: { value: 1, max: 2, errors: 0, type: 'unknown' } });

    if (isJudging && Object.keys(testCase.expected).length > 0) {
      await judgeCase(caseIndex, caseName, caseSuite, testCase, finalAnswer, started, queryIn, queryOut, result);
    } else {
      result.tests.push({
        name: caseName,
        status: 'pending',
        duration: Date.now() - started,
        message: 'Answered, not judged',
        suite: caseSuite,
        extra: {
          answer: finalAnswer,
          tokens: { input: queryIn, output: queryOut, query: { input: queryIn, output: queryOut }, judge: { input: 0, output: 0 } }
        }
      });
    }
  } catch (error) {
    // A case that fails to run (MCP unreachable, judge error…) is recorded and the run continues.
    result.failed = true;
    const message = error instanceof Error ? error.message : String(error);
    result.tests.push({ name: caseName, status: 'failed', duration: Date.now() - started, message, suite: caseSuite });
    logger.error({ source: 'mcp', pageId: caseIndex, message: `${caseName}: run failed`, error });
  }

  logger.info({ source: 'progress', pageId: caseIndex, message: caseName, data: { value: 2, max: 2, errors: result.failed ? 1 : 0, type: 'unknown', remove: true } });
  logger.info({ source: 'progress', pageId: undefined, message: 'Running cases', data: { value: ++completed, max: casePaths.length } });
  return result;
}

try {
  logger.info({ source: 'job', message: `MCP harness ${mcpUrl} — ${casePaths.length} case(s), judge ${isJudging ? 'enabled' : 'disabled'}, parallel ${configuration.parallel}` });
  logger.info({ source: 'progress', pageId: undefined, message: 'Running cases', data: { value: 0, max: casePaths.length } });

  const settled = await parallelize(runTestCase, casePaths, { parallel: configuration.parallel });

  // Fold per-case results back in case order so the report is deterministic regardless of
  // completion order. runCase catches its own errors, so a rejection here is unexpected.
  for (const outcome of settled) {
    if (outcome.status === 'rejected') {
      isAnyFailed = true;
      const message = outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason);
      logger.error({ source: 'job', message: `Unexpected case failure: ${message}` });
      continue;
    }
    const caseResult = outcome.value;
    tests.push(...caseResult.tests);
    queryInputTokens += caseResult.queryInputTokens;
    queryOutputTokens += caseResult.queryOutputTokens;
    judgeInputTokens += caseResult.judgeInputTokens;
    judgeOutputTokens += caseResult.judgeOutputTokens;
    if (caseResult.failed) {
      isAnyFailed = true;
    }
  }

  const results = createTestResults({ tool: builder.report.results.tool, tests });
  builder.report.results.tests = results.tests;
  // Keep the run start set by the builder's constructor — createTestResults resets it to 0,
  // which would make finalize() compute a nonsensical duration.
  builder.report.results.summary = { ...results.summary, start: builder.report.results.summary.start };
  builder.report.extra = {
    ...builder.report.extra,
    mcpUrl,
    judging: isJudging,
    tokens: {
      input: queryInputTokens + judgeInputTokens,
      output: queryOutputTokens + judgeOutputTokens,
      query: { input: queryInputTokens, output: queryOutputTokens },
      judge: { input: judgeInputTokens, output: judgeOutputTokens }
    }
  };

  builder.finalize();
  await saveReport(configuration, builder.report);
  logger.info({ source: 'job', message: `Done — ${tests.length} test(s), ${isAnyFailed ? 'some failed' : 'all passed'}` });
} finally {
  await logger.stop();
}

process.exitCode = isAnyFailed ? 1 : 0;
