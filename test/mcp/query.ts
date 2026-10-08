import { loadProvider } from './provider.js';
import { loadMcpTools } from './mcpClient.js';
import { buildFileTools } from './fileTools.js';
import { Harness  } from './Harness.js';
import type {TestCase} from './testCase.js';

export interface QueryResult {
  finalAnswer: string;
  inputTokens: number;
  outputTokens: number;
}

const SYSTEM_PROMPT = `You are helping a user discover a tool named ui5-test-runner.

The user's project files are available through the read_file tool: read a file by its path
to inspect it. The tool returns an error if the file does not exist.

Work from the documentation, then apply it to the user's actual situation:
- Follow the documentation's own guidance. When a topic tells you how to check or decide
  something, carry that procedure out rather than merely describing it.
- When the user provides project files, inspect them and apply what the documentation says
  to their specific contents. For every relevant setting you find, state a concrete
  conclusion — does it still apply, has it changed, was it removed — naming the setting.
- Lead with the headline action the question calls for before the supporting detail.
- Do not leave the user with "you should check X"; do the check and report the result.

You must structure your answer in two parts :
1) First you answer the user question
2) You insert --- and then you enumerate only the topics you explored and the reason why. Build a table like :
|topic|reason|
|-----|------|
|topic_name|reason|
`;

/**
 * Runs a single test case against the MCP server: builds a harness on the model under test
 * wired to the MCP tools and a `read_file` tool over the case's files, feeds it the question
 * and returns the final answer with the token tally. The model reaches the case's files only
 * by calling `read_file` — they are not injected into the question. The harness traces its
 * requests, responses and tool calls under the `mcp` source, tagged with `pageId` (the case
 * index).
 */
export async function runQuery(mcpUrl: string, testCase: TestCase, pageId: number): Promise<QueryResult> {
  const provider = loadProvider();
  const tools = [...(await loadMcpTools(mcpUrl)), ...buildFileTools(testCase.files)];
  const harness = new Harness({ provider, tools, pageId });

  const finalAnswer = await harness.ask([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: testCase.question }
  ]);

  return { finalAnswer, inputTokens: harness.inputTokens, outputTokens: harness.outputTokens };
}
