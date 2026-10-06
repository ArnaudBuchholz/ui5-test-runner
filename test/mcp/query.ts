import { loadProvider } from './provider.js';
import { loadMcpTools } from './mcpClient.js';
import { Harness, type Emit } from './Harness.js';
import { buildUserMessage, type TestCase } from './testCase.js';

export interface QueryResult {
  finalAnswer: string;
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
 * with the token tally. Observable events (requests, responses, tool calls) are surfaced
 * through `emit`; this function writes nothing itself.
 */
export async function runQuery(mcpUrl: string, testCase: TestCase, emit: Emit): Promise<QueryResult> {
  const provider = loadProvider();
  const tools = await loadMcpTools(mcpUrl);
  const harness = new Harness({ provider, tools, emit });

  const finalAnswer = await harness.ask([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserMessage(testCase) }
  ]);

  return { finalAnswer, inputTokens: harness.inputTokens, outputTokens: harness.outputTokens };
}
