export interface McpTool {
  name: string;
  description: string;
  parameters: Record<string, { type: 'string'; description: string }>;
  execute: (arguments_: Record<string, unknown>) => Promise<string>;
}

interface McpJsonRpcResponse {
  result?: unknown;
  error?: { message: string };
}

async function mcpPost(
  url: string,
  method: string,
  parameters: Record<string, unknown>,
  sessionId?: string
): Promise<McpJsonRpcResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream'
  };
  if (sessionId) {
    headers['Mcp-Session-Id'] = sessionId;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: parameters })
  });
  if (!response.ok) {
    throw new Error(`MCP server returned HTTP ${response.status}`);
  }
  const text = await response.text();
  // Streamable HTTP may return SSE — extract the first data line if so
  const line = text.startsWith('data:')
    ? (text.split('\n').find((l) => l.startsWith('data:'))?.slice(5).trim() ?? text)
    : text;
  return JSON.parse(line) as McpJsonRpcResponse;
}

export async function loadMcpTools(serverUrl: string): Promise<McpTool[]> {
  // 1. Initialize — get the (optional) session id
  const initResponse = await fetch(serverUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        clientInfo: { name: 'ui5-test-runner-mcp-harness', version: '1.0.0' },
        capabilities: {}
      }
    })
  });
  if (!initResponse.ok) {
    throw new Error(`MCP initialize failed: HTTP ${initResponse.status}`);
  }
  const sessionId = initResponse.headers.get('Mcp-Session-Id') ?? undefined;

  // 2. List tools
  const listResponse = await mcpPost(serverUrl, 'tools/list', {}, sessionId);
  if (listResponse.error) {
    throw new Error(`MCP tools/list error: ${listResponse.error.message}`);
  }
  const rawTools = ((listResponse.result as { tools?: unknown } | undefined)?.tools ?? []) as Array<{
    name: string;
    description?: string;
    inputSchema?: { properties?: Record<string, { type?: string; description?: string }> };
  }>;

  // 3. Map to McpTool
  return rawTools.map((tool) => {
    const rawProperties = tool.inputSchema?.properties ?? {};
    const parameters: McpTool['parameters'] = {};
    for (const [key, value] of Object.entries(rawProperties)) {
      parameters[key] = { type: 'string', description: value.description ?? '' };
    }

    return {
      name: tool.name,
      description: tool.description ?? '',
      parameters,
      execute: async (arguments_: Record<string, unknown>): Promise<string> => {
        const callResponse = await mcpPost(serverUrl, 'tools/call', { name: tool.name, arguments: arguments_ }, sessionId);
        if (callResponse.error) {
          return `Error: ${callResponse.error.message}`;
        }
        const content = (callResponse.result as { content?: unknown } | undefined)?.content as
          | Array<{ type: string; text?: string }>
          | undefined;
        if (!content?.length) {
          return '';
        }
        return content[0]!.type === 'text' && content[0]!.text !== undefined ? content[0]!.text : JSON.stringify(content);
      }
    };
  });
}
