export interface McpTool {
  name: string;
  description: string;
  parameters: Record<string, { type: 'string'; description: string }>;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

interface McpJsonRpcResponse {
  result?: Record<string, unknown>;
  error?: { message: string };
}

async function mcpPost(
  url: string,
  method: string,
  params: Record<string, unknown>,
  sessionId?: string
): Promise<McpJsonRpcResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream'
  };
  if (sessionId) {
    headers['Mcp-Session-Id'] = sessionId;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  if (!res.ok) {
    throw new Error(`MCP server returned HTTP ${res.status}`);
  }
  const text = await res.text();
  // Streamable HTTP may return SSE — extract the first data line if so
  const line = text.startsWith('data:')
    ? (text.split('\n').find((l) => l.startsWith('data:'))?.slice(5).trim() ?? text)
    : text;
  return JSON.parse(line) as McpJsonRpcResponse;
}

export async function loadMcpTools(serverUrl: string): Promise<McpTool[]> {
  // 1. Initialize — get the (optional) session id
  const initRes = await fetch(serverUrl, {
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
  if (!initRes.ok) {
    throw new Error(`MCP initialize failed: HTTP ${initRes.status}`);
  }
  const sessionId = initRes.headers.get('Mcp-Session-Id') ?? undefined;

  // 2. List tools
  const listRes = await mcpPost(serverUrl, 'tools/list', {}, sessionId);
  if (listRes.error) {
    throw new Error(`MCP tools/list error: ${listRes.error.message}`);
  }
  const rawTools = (listRes.result?.tools ?? []) as Array<{
    name: string;
    description?: string;
    inputSchema?: { properties?: Record<string, { type?: string; description?: string }> };
  }>;

  // 3. Map to McpTool
  return rawTools.map((tool) => {
    const rawProps = tool.inputSchema?.properties ?? {};
    const parameters: McpTool['parameters'] = {};
    for (const [key, value] of Object.entries(rawProps)) {
      parameters[key] = { type: 'string', description: value.description ?? '' };
    }

    return {
      name: tool.name,
      description: tool.description ?? '',
      parameters,
      execute: async (args: Record<string, unknown>): Promise<string> => {
        const callRes = await mcpPost(serverUrl, 'tools/call', { name: tool.name, arguments: args }, sessionId);
        if (callRes.error) {
          return `Error: ${callRes.error.message}`;
        }
        const content = callRes.result?.content as Array<{ type: string; text?: string }> | undefined;
        if (!content?.length) {
          return '';
        }
        if (content[0].type === 'text' && content[0].text !== undefined) {
          return content[0].text;
        }
        return JSON.stringify(content);
      }
    };
  });
}
