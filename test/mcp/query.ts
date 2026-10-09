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

The user is working inside a project. Its files are not given to you up front — you must
probe for them with the read_file tool: read a file by its path to inspect it; the tool
returns an error if the file does not exist. Before answering a question about an existing
project, migration, or configuration, actively try to read the files such a question
implies (for example package.json and ui5-test-runner.json) and base your answer on what
you actually find in them. Follow references you discover: when a file you read points at
another file — for instance a script invoking ui5-test-runner with --config <file>, or any
named configuration file — read that file too before answering, and account for its
contents. Do not answer about configuration until you have read the configuration file the
project actually uses.

Work from the documentation, then apply it to the user's actual situation:
- Follow the documentation's own guidance. When a topic tells you how to check or decide
  something, carry that procedure out rather than merely describing it.
- Inspect the project files you were able to read and apply what the documentation says to
  their specific contents. For every relevant setting you find, state a concrete
  conclusion — does it still apply, has it changed, was it removed — naming the setting.
- Scope the answer to the project. Only cover topics that actually apply to what you found
  in the project's files. When the documentation marks a topic as conditional, or it only
  concerns a setting the project does not use, leave it out entirely — do not mention it,
  not even to say it does not apply. Tailor the answer to this project rather than
  summarizing the whole guide.
- Lead with the headline action the question calls for before the supporting detail.
- Do not leave the user with "you should check X"; do the check and report the result.

You must structure your answer in two parts :
1) First you answer the user question
2) You insert --- and then you enumerate only the topics that are relevant to this project and
   informed your answer, with the reason why. Do not list topics you examined and set aside as
   not applicable. Build a table like :
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
  // Pin a low temperature: the query is a retrieval/reasoning task, not a creative one, and a
  // low temperature cuts the run-to-run variance in whether the model probes the project files.
  const harness = new Harness({ provider, tools, pageId, temperature: 0 });

  const finalAnswer = await harness.ask([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: testCase.question }
  ]);

  return { finalAnswer, inputTokens: harness.inputTokens, outputTokens: harness.outputTokens };
}
