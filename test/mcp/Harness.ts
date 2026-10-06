import OpenAI from 'openai';
import type { ProviderConfig } from './provider.js';
import type { McpTool } from './mcpClient.js';

/**
 * A single observable event from the conversation loop. The caller decides what to do with it
 * (log it, trace it, ignore it) — the Harness only emits.
 */
export interface HarnessEvent {
  kind: 'request' | 'response' | 'tool';
  data: unknown;
}

export type Emit = (event: HarnessEvent) => void;

export interface HarnessOptions {
  provider: ProviderConfig;
  tools?: McpTool[];
  emit?: Emit;
}

/**
 * A generic conversation engine over an OpenAI-compatible endpoint. It owns the client,
 * drives the (optionally tool-calling) agentic loop and monitors token usage. It knows
 * nothing about prompts or test cases — the provider, tools and prompts are all supplied
 * by the caller, at construction or per `ask`. Observable events (requests, responses, tool
 * calls) are surfaced through the injected `emit` callback; the Harness itself writes nothing.
 */
export class Harness {
  private readonly provider: ProviderConfig;
  private readonly client: OpenAI;
  private readonly toolByName: Map<string, McpTool>;
  private readonly openaiTools: OpenAI.Chat.ChatCompletionTool[];
  private readonly emit: Emit;

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
    this.emit = options.emit ?? (() => {});
  }

  get model(): string {
    return this.provider.model;
  }

  get toolCount(): number {
    return this.toolByName.size;
  }

  private async executeTool(name: string, arguments_: Record<string, unknown>): Promise<string> {
    const tool = this.toolByName.get(name);
    return tool ? tool.execute(arguments_) : `Error: unknown tool "${name}"`;
  }

  // Resolves every function tool call in the assistant message, emitting each and appending
  // its result to the history as a `tool` message.
  private async resolveToolCalls(
    history: OpenAI.Chat.ChatCompletionMessageParam[],
    toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[]
  ): Promise<void> {
    for (const call of toolCalls) {
      if (call.type !== 'function') {
        continue;
      }
      const arguments_ = JSON.parse(call.function.arguments) as Record<string, unknown>;
      const result = await this.executeTool(call.function.name, arguments_);
      this.emit({ kind: 'tool', data: { name: call.function.name, arguments: call.function.arguments, result } });
      history.push({ role: 'tool', tool_call_id: call.id, content: result });
    }
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
        ...((this.openaiTools.length > 0) && { tools: this.openaiTools })
      };
      this.emit({ kind: 'request', data: request });
      const response = await this.client.chat.completions.create(request);
      this.emit({ kind: 'response', data: response });

      const usage = response.usage;
      if (usage) {
        this.inputTokens += usage.prompt_tokens;
        this.outputTokens += usage.completion_tokens;
      }

      const choice = response.choices[0];
      if (!choice) {
        return '';
      }
      history.push(choice.message);

      if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
        await this.resolveToolCalls(history, choice.message.tool_calls);
        continue;
      }

      return choice.message.content ?? '';
    }
  }
}
