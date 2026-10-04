import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import OpenAI from 'openai';
import { loadProvider } from './provider.js';
import { loadMcpTools, type McpTool } from './mcpClient.js';
import { loadTestCase, buildUserMessage } from './testCase.js';
// import { judge } from './judge.js';

function parseArgs(argv: string[]): { mcpUrl: string; casePath: string } {
  const mcpIndex = argv.indexOf('--mcp');
  const mcpUrl = mcpIndex !== -1 ? argv[mcpIndex + 1] : undefined;
  const casePath = argv.find((arg, index) => arg.endsWith('.toml') && index !== mcpIndex + 1);
  if (!mcpUrl || !casePath) {
    console.error('Usage: mcp:harness --mcp <url> <case.toml>');
    process.exit(1);
  }
  return { mcpUrl, casePath };
}

const { mcpUrl, casePath } = parseArgs(process.argv.slice(2));

const sessionDir = join('test', 'mcp', 'tmp', new Date().toISOString().replace(/[:.]/g, '-'));
mkdirSync(sessionDir, { recursive: true });
let traceIndex = 0;

function trace(label: string, payload: unknown): void {
  const n = String(traceIndex++).padStart(3, '0');
  writeFileSync(join(sessionDir, `${n}-${label}.json`), JSON.stringify(payload, null, 2));
}

const gray = (s: string): string => `\x1b[90m${s}\x1b[0m`;
const yellow = (s: string): string => `\x1b[33m${s}\x1b[0m`;
const green = (s: string): string => `\x1b[32m${s}\x1b[0m`;
const red = (s: string): string => `\x1b[31m${s}\x1b[0m`;

const provider = loadProvider();
const testCase = loadTestCase(casePath);
const tools = await loadMcpTools(mcpUrl);

console.log(`Model: ${provider.model}`);
console.log(`MCP server: ${mcpUrl} (${tools.length} tools loaded)`);
console.log(`Case: ${casePath}`);
console.log(`Session traces: ${sessionDir}\n`);

const toolByName = new Map<string, McpTool>(tools.map((tool) => [tool.name, tool]));

async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  const tool = toolByName.get(name);
  if (!tool) {
    return `Error: unknown tool "${name}"`;
  }
  return tool.execute(args);
}

const openaiTools: OpenAI.Chat.ChatCompletionTool[] = tools.map((tool) => ({
  type: 'function',
  function: {
    name: tool.name,
    description: tool.description,
    parameters: { type: 'object', properties: tool.parameters }
  }
}));

const client = new OpenAI({ apiKey: provider.apiKey, baseURL: provider.baseURL });
const history: OpenAI.Chat.ChatCompletionMessageParam[] = [
  { role: 'system', content: `You are helping a user discover a tool named ui5-test-runner.

You must structure you answer in two parts :
1) First you answer the user question
2) You insert --- and then you enumerate only the topics you explored and the reason why. Build a table like :
|topic|reason|
|-----|------|
|topic_name|reason|
`},
  { role: 'user', content: buildUserMessage(testCase) }
];

let totalInputTokens = 0;
let totalOutputTokens = 0;

let finalAnswer = '';

// Agentic loop — keep calling until no tool_calls remain
while (true) {
  const request = {
    model: provider.model,
    messages: history,
    ...(openaiTools.length > 0 ? { tools: openaiTools } : {})
  };
  trace('request', request);
  const response = await client.chat.completions.create(request);
  trace('response', response);

  const usage = response.usage;
  if (usage) {
    totalInputTokens += usage.prompt_tokens;
    totalOutputTokens += usage.completion_tokens;
  }

  const choice = response.choices[0];
  if (!choice) {
    break;
  }
  history.push(choice.message as OpenAI.Chat.ChatCompletionMessageParam);

  if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
    for (const call of choice.message.tool_calls) {
      const args = JSON.parse(call.function.arguments) as Record<string, unknown>;
      process.stdout.write(gray(`[tool] ${call.function.name}(${call.function.arguments})\n`));
      const result = await executeTool(call.function.name, args);
      process.stdout.write(gray(`[tool result] ${result}\n`));
      history.push({ role: 'tool', tool_call_id: call.id, content: result });
    }
    continue;
  }

  finalAnswer = choice.message.content ?? '';
  console.log(`\n${yellow('Assistant:')} ${finalAnswer}`);
  break;
}

console.log(gray(`\n[tokens] input: ${totalInputTokens}, output: ${totalOutputTokens}`));

/*
const criteria = Object.keys(testCase.expected);
if (criteria.length > 0) {
  console.log(`\n${yellow('Evaluation:')} ${criteria.length} criteria`);
  const { verdicts, passed } = await judge(testCase.question, finalAnswer, testCase.expected);
  for (const verdict of verdicts) {
    const mark = verdict.pass ? green('PASS') : red('FAIL');
    console.log(`  ${mark} ${verdict.name} — ${verdict.rationale}`);
  }
  console.log(passed ? green('\nAll criteria passed.') : red('\nSome criteria failed.'));
  if (!passed) {
    process.exit(1);
  }
}
*/