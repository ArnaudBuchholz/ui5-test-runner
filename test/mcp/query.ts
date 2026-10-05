import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadProvider } from './provider.js';
import { loadMcpTools } from './mcpClient.js';
import { Harness, makeTracer } from './Harness.js';
import { buildUserMessage, type TestCase } from './testCase.js';

export interface QueryResult {
  finalAnswer: string;
  answerPath: string;
  inputTokens: number;
  outputTokens: number;
}

const SYSTEM_PROMPT = `You are helping a user discover a tool named ui5-test-runner.

You must structure you answer in two parts :
1) First you answer the user question
2) You insert --- and then you enumerate only the topics you explored and the reason why. Build a table like :
|topic|reason|
|-----|------|
|topic_name|reason|
`;

/**
 * Runs a single test case against the MCP server: builds a harness on the model under test
 * wired to the MCP tools, feeds it the question (and any files) and returns the final answer
 * with the token tally. Everything is written to `traceDir`: the per-request/response traces
 * and tool calls as numbered JSON files, the answer as `answer.txt`, and the token usage as
 * `tokens.json`. Nothing is printed to the terminal.
 */
export async function runQuery(mcpUrl: string, testCase: TestCase, traceDir: string): Promise<QueryResult> {
  const provider = loadProvider();
  const tools = await loadMcpTools(mcpUrl);
  const trace = makeTracer(traceDir);
  const harness = new Harness({
    provider,
    tools,
    trace,
    onTool: (event) => trace('tool', event)
  });

  const finalAnswer = await harness.ask([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserMessage(testCase) }
  ]);

  const answerPath = join(traceDir, 'answer.txt');
  writeFileSync(answerPath, finalAnswer);

  const { inputTokens, outputTokens } = harness;
  writeFileSync(join(traceDir, 'tokens.json'), JSON.stringify({ inputTokens, outputTokens }, null, 2));

  return { finalAnswer, answerPath, inputTokens, outputTokens };
}
