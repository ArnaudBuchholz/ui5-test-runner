import 'dotenv/config';
import { globSync } from 'node:fs';
import { join, relative } from 'node:path';
import { logger } from '../../src/platform/index.js';
import { ConfigurationValidator } from '../../src/configuration/ConfigurationValidator.js';
import { initReportBuilder } from '../../src/reports/initReportBuilder.js';
import { saveReport } from '../../src/reports/saveReport.js';
import { createTestResults  } from '../../src/types/CommonTestReportFormat.js';
import type {CTRFTest} from '../../src/types/CommonTestReportFormat.js';
import { Folder } from '../../src/utils/node/Folder.js';
import { loadProvider } from './provider.js';
import { runQuery } from './query.js';
import { loadTestCase } from './testCase.js';
import { judge, JUDGE_ENV_VAR } from './judge.js';
import type { Emit } from './Harness.js';

const CASES_DIR = join('test', 'mcp', 'cases');

function parseArguments(argv: string[]): { mcpUrl: string; casePaths: string[] } {
  const mcpIndex = argv.indexOf('--mcp');
  const mcpUrl = mcpIndex === -1 ? undefined : argv[mcpIndex + 1];
  if (!mcpUrl) {
    throw new Error('Usage: test:mcp --mcp <url> [case.toml ...]');
  }
  const explicit = argv.filter((argument, index) => argument.endsWith('.toml') && index !== mcpIndex + 1);
  const casePaths =
    explicit.length > 0 ? explicit : globSync(join(CASES_DIR, '**', '*.toml')).toSorted((a, b) => a.localeCompare(b));
  if (casePaths.length === 0) {
    throw new Error(`No test cases found under ${CASES_DIR}`);
  }
  return { mcpUrl, casePaths };
}

// Derives a filesystem-safe suite name from a case path (relative to the cases dir).
function caseNameOf(casePath: string): string {
  return relative(CASES_DIR, casePath).replaceAll(/[/\\]/g, '-').replace(/\.toml$/, '');
}

const { mcpUrl, casePaths } = parseArguments(process.argv.slice(2));
const isJudging = process.env[JUDGE_ENV_VAR] !== undefined;

// Validate providers up front, before the logger pipeline starts: a bad env var throws
// inside loadProvider, and failing here keeps a later throw from racing logger.stop().
loadProvider();
if (isJudging) {
  loadProvider(JUDGE_ENV_VAR);
}

const configuration = await ConfigurationValidator.validate({ reportDir: 'report', noBanner: true });
const builder = await initReportBuilder(configuration);
await Folder.create(configuration.reportDir);
await logger.start(configuration);

const tests: CTRFTest[] = [];
let isAnyFailed = false;
let queryInputTokens = 0;
let queryOutputTokens = 0;
let judgeInputTokens = 0;
let judgeOutputTokens = 0;

try {
  logger.info({ source: 'job', message: `MCP harness ${mcpUrl} — ${casePaths.length} case(s), judge ${isJudging ? 'enabled' : 'disabled'}` });
  logger.info({ source: 'progress', pageId: undefined, message: 'Running cases', data: { value: 0, max: casePaths.length } });

  for (let caseIndex = 0; caseIndex < casePaths.length; caseIndex++) {
    const casePath = casePaths[caseIndex]!;
    const caseName = caseNameOf(casePath);
    const testCase = loadTestCase(casePath);
    const started = Date.now();

    // Requests/responses/tool calls go to the trace file only (debug), tagged with the case index.
    const emit: Emit = (event) =>
      logger.debug({ source: 'mcp', pageId: caseIndex, message: `${caseName}: ${event.kind}`, data: { kind: event.kind, payload: event.data } });

    logger.info({ source: 'progress', pageId: caseIndex, message: caseName, data: { value: 0, max: 1, errors: 0, type: 'unknown' } });

    let isCaseFailed = false;

    try {
      const { finalAnswer, inputTokens: queryIn, outputTokens: queryOut } = await runQuery(mcpUrl, testCase, emit);
      queryInputTokens += queryIn;
      queryOutputTokens += queryOut;
      logger.info({ source: 'mcp', pageId: caseIndex, message: `${caseName}: answer`, data: { answer: finalAnswer, tokens: { input: queryIn, output: queryOut } } });

      const criteria = Object.keys(testCase.expected);
      if (isJudging && criteria.length > 0) {
        let judgeIn = 0;
        let judgeOut = 0;
        const result = await judge(testCase.question, finalAnswer, testCase.expected, emit);
        judgeIn = result.inputTokens;
        judgeOut = result.outputTokens;
        judgeInputTokens += judgeIn;
        judgeOutputTokens += judgeOut;

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
          logger.info({ source: 'mcp', pageId: caseIndex, message: `${verdict.pass ? 'PASS' : 'FAIL'} ${caseName}/${verdict.name}`, data: { rationale: verdict.rationale } });
        }

        if (!result.passed) {
          isAnyFailed = true;
          isCaseFailed = true;
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
      isAnyFailed = true;
      isCaseFailed = true;
      const message = error instanceof Error ? error.message : String(error);
      tests.push({ name: caseName, status: 'failed', duration: Date.now() - started, message, suite: [caseName] });
      logger.error({ source: 'mcp', pageId: caseIndex, message: `${caseName}: run failed`, error });
    }

    logger.info({ source: 'progress', pageId: caseIndex, message: caseName, data: { value: 1, max: 1, errors: isCaseFailed ? 1 : 0, type: 'unknown' } });
    logger.info({ source: 'progress', pageId: undefined, message: 'Running cases', data: { value: caseIndex + 1, max: casePaths.length } });
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
