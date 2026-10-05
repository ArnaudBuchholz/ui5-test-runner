import OpenAI from 'openai';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProviderConfig } from './provider.js';
import type { McpTool } from './mcpClient.js';

export type Tracer = (label: string, payload: unknown) => void;

// Builds a trace writer that serializes each payload to a numbered JSON file in `traceDir`.
export function makeTracer(traceDir: string): Tracer {
  mkdirSync(traceDir, { recursive: true });
  let traceIndex = 0;
  return (label, payload) => {
    const n = String(traceIndex++).padStart(3, '0');
    writeFileSync(join(traceDir, `${n}-${label}.json`), JSON.stringify(payload, null, 2));
  };
}

export interface ToolEvent {
  name: string;
  arguments: string;
  result: string;
}

export interface HarnessOptions {
  provider: ProviderConfig;
  tools?: McpTool[];
  trace?: Tracer;
  onTool?: (event: ToolEvent) => void;
}

/**
 * A generic conversation engine over an OpenAI-compatible endpoint. It owns the client,
 * drives the (optionally tool-calling) agentic loop and monitors token usage. It knows
 * nothing about prompts or test cases — the provider, tools and prompts are all supplied
 * by the caller, at construction or per `ask`.
 */
export class Harness {
  private readonly provider: ProviderConfig;
  private readonly client: OpenAI;
  private readonly toolByName: Map<string, McpTool>;
  private readonly openaiTools: OpenAI.Chat.ChatCompletionTool[];
  private readonly trace: Tracer;
  private readonly onTool?: (event: ToolEvent) => void;

  inputTokens = 0;
  outputTokens = 0;

  constructor(options: HarnessOptions) {
    const tools = options.tools ?? [];
    this.provider = options.provider;
    this.client = new OpenAI({ apiKey: options.provider.apiKey, baseURL: options.provider.baseURL });
    this.toolByName = new Map(tools.map((tool) => [tool.name, tool]));
    this.openaiTools = tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: { type: 'object', properties: tool.parameters }
      }
    }));
    this.trace = options.trace ?? (() => {});
    this.onTool = options.onTool;
  }

  get model(): string {
    return this.provider.model;
  }

  get toolCount(): number {
    return this.toolByName.size;
  }

  private async executeTool(name: string, args: Record<string, unknown>): Promise<string> {
    const tool = this.toolByName.get(name);
    if (!tool) {
      return `Error: unknown tool "${name}"`;
    }
    return tool.execute(args);
  }

  /**
   * Drives a conversation from the given messages, resolving any tool calls, until the
   * model returns a plain answer. Returns the final assistant content. Token counters
   * accumulate across every call.
   */
  async ask(messages: OpenAI.Chat.ChatCompletionMessageParam[]): Promise<string> {
    const history = [...messages];

    // Agentic loop — keep calling until no tool_calls remain
    while (true) {
      const request = {
        model: this.provider.model,
        messages: history,
        ...(this.openaiTools.length > 0 ? { tools: this.openaiTools } : {})
      };
      this.trace('request', request);
      const response = await this.client.chat.completions.create(request);
      this.trace('response', response);

      const usage = response.usage;
      if (usage) {
        this.inputTokens += usage.prompt_tokens;
        this.outputTokens += usage.completion_tokens;
      }

      const choice = response.choices[0];
      if (!choice) {
        return '';
      }
      history.push(choice.message as OpenAI.Chat.ChatCompletionMessageParam);

      if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
        for (const call of choice.message.tool_calls) {
          const args = JSON.parse(call.function.arguments) as Record<string, unknown>;
          const result = await this.executeTool(call.function.name, args);
          this.onTool?.({ name: call.function.name, arguments: call.function.arguments, result });
          history.push({ role: 'tool', tool_call_id: call.id, content: result });
        }
        continue;
      }

      return choice.message.content ?? '';
    }
  }
}
