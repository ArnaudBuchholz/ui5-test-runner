import 'dotenv/config';
import { globSync } from 'node:fs';
import { join, relative } from 'node:path';
import { runQuery } from './query.js';
import { loadTestCase } from './testCase.js';
import { judge, JUDGE_ENV_VAR } from './judge.js';

const CASES_DIR = join('test', 'mcp', 'cases');

function parseArgs(argv: string[]): { mcpUrl: string; casePaths: string[] } {
  const mcpIndex = argv.indexOf('--mcp');
  const mcpUrl = mcpIndex !== -1 ? argv[mcpIndex + 1] : undefined;
  if (!mcpUrl) {
    console.error('Usage: mcp:harness --mcp <url> [case.toml ...]');
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

// Derives a filesystem-safe sub-folder name from a case path (relative to the cases dir).
function caseNameOf(casePath: string): string {
  return relative(CASES_DIR, casePath).replace(/[/\\]/g, '-').replace(/\.toml$/, '');
}

const { mcpUrl, casePaths } = parseArgs(process.argv.slice(2));
const judging = process.env[JUDGE_ENV_VAR] !== undefined;

// One base folder for the whole run; one sub-folder (and one Harness) per test case.
const baseDir = join('test', 'mcp', 'logs', new Date().toISOString().replace(/[:.]/g, '-'));

console.log(`MCP server: ${mcpUrl}`);
console.log(`Cases: ${casePaths.length}`);
console.log(`Judge: ${judging ? 'enabled' : 'disabled (set JUDGE to enable)'}`);
console.log(`Session traces: ${baseDir}\n`);

let anyFailed = false;

for (const casePath of casePaths) {
  console.log(`\n=== ${casePath} ===`);
  const testCase = loadTestCase(casePath);

  const caseDir = join(baseDir, caseNameOf(casePath));
  const { finalAnswer } = await runQuery(mcpUrl, testCase, caseDir);

  const criteria = Object.keys(testCase.expected);
  if (judging && criteria.length > 0) {
    console.log(`Evaluation: ${criteria.length} criteria`);
    const { verdicts, passed } = await judge(testCase.question, finalAnswer, testCase.expected, caseDir);
    for (const verdict of verdicts) {
      const mark = verdict.pass ? 'PASS' : 'FAIL';
      console.log(`  ${mark} ${verdict.name} — ${verdict.rationale}`);
    }
    console.log(passed ? 'All criteria passed.' : 'Some criteria failed.');
    if (!passed) {
      anyFailed = true;
    }
  }
}

if (anyFailed) {
  process.exit(1);
}
