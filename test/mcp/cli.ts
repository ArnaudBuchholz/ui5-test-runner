import 'dotenv/config';
import { globSync } from 'node:fs';
import { join, relative } from 'node:path';
import { logger } from '../../src/platform/index.js';
import { ConfigurationValidator } from '../../src/configuration/ConfigurationValidator.js';
import { initReportBuilder } from '../../src/reports/initReportBuilder.js';
import { saveReport } from '../../src/reports/saveReport.js';
import { createTestResults, type CTRFTest } from '../../src/types/CommonTestReportFormat.js';
import { Folder } from '../../src/utils/node/Folder.js';
import { loadProvider } from './provider.js';
import { runQuery } from './query.js';
import { loadTestCase } from './testCase.js';
import { judge, JUDGE_ENV_VAR } from './judge.js';
import type { Emit } from './Harness.js';

const CASES_DIR = join('test', 'mcp', 'cases');

function parseArgs(argv: string[]): { mcpUrl: string; casePaths: string[] } {
  const mcpIndex = argv.indexOf('--mcp');
  const mcpUrl = mcpIndex !== -1 ? argv[mcpIndex + 1] : undefined;
  if (!mcpUrl) {
    console.error('Usage: test:mcp --mcp <url> [case.toml ...]');
    process.exit(1);
  }
  const explicit = argv.filter((arg, index) => arg.endsWith('.toml') && index !== mcpIndex + 1);
  const casePaths = explicit.length > 0 ? explicit : globSync(join(CASES_DIR, '**', '*.toml')).sort();
  if (casePaths.length === 0) {
    console.error(`No test cases found under ${CASES_DIR}`);
    process.exit(1);
  }
  return { mcpUrl, casePaths };
}

// Derives a filesystem-safe suite name from a case path (relative to the cases dir).
function caseNameOf(casePath: string): string {
  return relative(CASES_DIR, casePath).replace(/[/\\]/g, '-').replace(/\.toml$/, '');
}

const { mcpUrl, casePaths } = parseArgs(process.argv.slice(2));
const judging = process.env['JUDGE'] !== undefined;

// Validate providers up front, before the logger pipeline starts: a bad env var calls
// process.exit(1) inside loadProvider, and this keeps that exit from skipping logger.stop().
loadProvider();
if (judging) {
  loadProvider(JUDGE_ENV_VAR);
}

// `ci` is left to its default (`!process.stdout.isTTY`): animated progress bars on an
// interactive terminal, and the static text output (which also writes report/output.txt)
// everywhere else — crucially avoiding the interactive path's process.stdin.setRawMode(true),
// which throws on a non-TTY (piped shell / CI).
const configuration = await ConfigurationValidator.validate({ reportDir: 'report', outputInterval: 2000 });
const builder = await initReportBuilder(configuration);
await Folder.create(configuration.reportDir);
await logger.start(configuration);

const tests: CTRFTest[] = [];
let anyFailed = false;
let qIn = 0;
let qOut = 0;
let jIn = 0;
let jOut = 0;

try {
  logger.info({ source: 'job', message: `MCP harness ${mcpUrl} — ${casePaths.length} case(s), judge ${judging ? 'enabled' : 'disabled'}` });
  logger.info({ source: 'progress', pageId: undefined, message: 'Running cases', data: { value: 0, max: casePaths.length } });

  for (let i = 0; i < casePaths.length; i++) {
    const casePath = casePaths[i]!;
    const caseName = caseNameOf(casePath);
    const testCase = loadTestCase(casePath);
    const started = Date.now();

    // Requests/responses/tool calls go to the trace file only (debug), tagged with the case index.
    const emit: Emit = (event) =>
      logger.debug({ source: 'mcp', pageId: i, message: `${caseName}: ${event.kind}`, data: { kind: event.kind, payload: event.data } });

    logger.info({ source: 'progress', pageId: i, message: caseName, data: { value: 0, max: 1, errors: 0, type: 'unknown' } });

    let caseFailed = false;

    try {
      const { finalAnswer, inputTokens: queryIn, outputTokens: queryOut } = await runQuery(mcpUrl, testCase, emit);
      qIn += queryIn;
      qOut += queryOut;
      logger.info({ source: 'mcp', pageId: i, message: `${caseName}: answer`, data: { answer: finalAnswer, tokens: { input: queryIn, output: queryOut } } });

      const criteria = Object.keys(testCase.expected);
      let judgeIn = 0;
      let judgeOut = 0;

      if (judging && criteria.length > 0) {
        const result = await judge(testCase.question, finalAnswer, testCase.expected, emit);
        judgeIn = result.inputTokens;
        judgeOut = result.outputTokens;
        jIn += judgeIn;
        jOut += judgeOut;

        const tokens = {
          input: queryIn + judgeIn,
          output: queryOut + judgeOut,
          query: { input: queryIn, output: queryOut },
          judge: { input: judgeIn, output: judgeOut }
        };

        for (const verdict of result.verdicts) {
          tests.push({
            name: verdict.name,
            status: verdict.pass ? 'passed' : 'failed',
            duration: Date.now() - started,
            message: verdict.rationale,
            suite: [caseName],
            extra: { criterion: verdict.criterion, answer: finalAnswer, tokens }
          });
          logger.info({ source: 'mcp', pageId: i, message: `${verdict.pass ? 'PASS' : 'FAIL'} ${caseName}/${verdict.name}`, data: { rationale: verdict.rationale } });
        }

        if (!result.passed) {
          anyFailed = true;
          caseFailed = true;
        }
      } else {
        tests.push({
          name: caseName,
          status: 'pending',
          duration: Date.now() - started,
          message: 'Answered, not judged',
          suite: [caseName],
          extra: {
            answer: finalAnswer,
            tokens: { input: queryIn, output: queryOut, query: { input: queryIn, output: queryOut }, judge: { input: 0, output: 0 } }
          }
        });
      }
    } catch (error) {
      // A case that fails to run (MCP unreachable, judge error…) is recorded and the run continues.
      anyFailed = true;
      caseFailed = true;
      const message = error instanceof Error ? error.message : String(error);
      tests.push({ name: caseName, status: 'failed', duration: Date.now() - started, message, suite: [caseName] });
      logger.error({ source: 'mcp', pageId: i, message: `${caseName}: run failed`, error });
    }

    logger.info({ source: 'progress', pageId: i, message: caseName, data: { value: 1, max: 1, errors: caseFailed ? 1 : 0, type: 'unknown' } });
    logger.info({ source: 'progress', pageId: undefined, message: 'Running cases', data: { value: i + 1, max: casePaths.length } });
  }

  const results = createTestResults({ tool: builder.report.results.tool, tests });
  builder.report.results.tests = results.tests;
  // Keep the run start set by the builder's constructor — createTestResults resets it to 0,
  // which would make finalize() compute a nonsensical duration.
  builder.report.results.summary = { ...results.summary, start: builder.report.results.summary.start };
  builder.report.extra = {
    ...builder.report.extra,
    mcpUrl,
    judging,
    tokens: {
      input: qIn + jIn,
      output: qOut + jOut,
      query: { input: qIn, output: qOut },
      judge: { input: jIn, output: jOut }
    }
  };

  builder.finalize();
  await saveReport(configuration, builder.report);
  logger.info({ source: 'job', message: `Done — ${tests.length} test(s), ${anyFailed ? 'some failed' : 'all passed'}` });
} finally {
  await logger.stop();
}

process.exitCode = anyFailed ? 1 : 0;
