import type { Configuration as REserveConfiguration } from 'reserve';
import { body } from 'reserve';
import type { Configuration } from '../../configuration/Configuration.js';
import { TOOLS } from './tools/index.js';
import { FileSystem } from '../../platform/FileSystem.js';
import { Path } from '../../platform/Path.js';
import { Crypto, __sourcesRoot } from '../../platform/index.js';

const DOCS_DIR = Path.join(__sourcesRoot, '../docs');

const SERVER_INFO = {
  name: 'ui5-test-runner',
  version: '1.0.0'
};

// Protocol versions this server can speak. It echoes the client's requested version when supported,
// otherwise negotiates down to the newest it knows (first entry).
const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

const HTTP_OK = 200;
const HTTP_ACCEPTED = 202;
const HTTP_METHOD_NOT_ALLOWED = 405;
const HTTP_BAD_REQUEST = 400;

const JSONRPC_PARSE_ERROR = -32_700;
const JSONRPC_METHOD_NOT_FOUND = -32_601;
const JSONRPC_INVALID_PARAMS = -32_602;

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
};

// A request carries an id; a notification omits it entirely (JSON-RPC 2.0 §4.1 / §4.2).
type JsonRpcRequest = {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: unknown;
};

const buildError = (id: string | number | null, code: number, message: string): JsonRpcResponse => ({
  jsonrpc: '2.0',
  id,
  error: { code, message }
});

const isToolCallParameters = (
  parameters: unknown
): parameters is { name: string; arguments: Record<string, unknown> } =>
  typeof parameters === 'object' &&
  parameters !== null &&
  typeof (parameters as { name?: unknown }).name === 'string' &&
  typeof (parameters as { arguments?: unknown }).arguments === 'object';

const negotiateProtocolVersion = (parameters: unknown): string => {
  const requested = (parameters as { protocolVersion?: unknown } | undefined)?.protocolVersion;
  return typeof requested === 'string' && SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
    ? requested
    : SUPPORTED_PROTOCOL_VERSIONS[0]!;
};

// Returns the JSON-RPC response to serialize, or null when the input is a notification (no id):
// per the Streamable HTTP transport the server must then answer 202 Accepted with an empty body.
const handleRequest = async (request: JsonRpcRequest): Promise<JsonRpcResponse | null> => {
  const { id, method, params } = request;
  if (id === null || id === undefined) {
    // Notification (e.g. notifications/initialized) — accepted, nothing to return.
    return null;
  }
  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: negotiateProtocolVersion(params),
        serverInfo: SERVER_INFO,
        capabilities: { tools: {} }
      }
    };
  }
  if (method === 'ping') {
    // Mandatory keep-alive utility: respond with an empty result (MCP basic/utilities/ping).
    return { jsonrpc: '2.0', id, result: {} };
  }
  // We expose only tools (no resources/prompts capability), but clients probe these list methods
  // anyway; answer with an empty list rather than -32601 so the handshake isn't aborted.
  if (method === 'resources/list') {
    return { jsonrpc: '2.0', id, result: { resources: [] } };
  }
  if (method === 'prompts/list') {
    return { jsonrpc: '2.0', id, result: { prompts: [] } };
  }
  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: Object.values(TOOLS).map((t) => t.definition) } };
  }
  if (method === 'tools/call') {
    if (!isToolCallParameters(params)) {
      return buildError(id, JSONRPC_INVALID_PARAMS, 'Invalid params: expected { name, arguments }');
    }
    const tool = TOOLS[params.name];
    if (!tool) {
      return buildError(id, JSONRPC_METHOD_NOT_FOUND, `Unknown tool: ${params.name}`);
    }
    let content: string;
    try {
      content = await tool.handler(params.arguments);
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        result: { isError: true, content: [{ type: 'text', text: String(error) }] }
      };
    }
    return {
      jsonrpc: '2.0',
      id,
      result: { content: [{ type: 'text', text: content }] }
    };
  }
  return buildError(id, JSONRPC_METHOD_NOT_FOUND, `Method not found: ${method}`);
};

export const buildREserveConfiguration = (configuration: Configuration): REserveConfiguration => ({
  hostname: '127.0.0.1',
  port: configuration.port ?? 3000,
  mappings: [
    {
      method: 'GET',
      match: '/mcp',
      custom: (_request, response) => {
        response.writeHead(HTTP_METHOD_NOT_ALLOWED, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
      }
    },
    {
      method: 'POST',
      match: '/mcp',
      custom: async (request, response) => {
        let parsed: JsonRpcRequest;
        try {
          parsed = (await body(request).json()) as JsonRpcRequest;
        } catch {
          response.writeHead(HTTP_BAD_REQUEST, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify(buildError(null, JSONRPC_PARSE_ERROR, 'Parse error')));
          return;
        }
        const result = await handleRequest(parsed);
        if (result === null) {
          response.writeHead(HTTP_ACCEPTED);
          response.end();
          return;
        }
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (parsed.method === 'initialize') {
          headers['Mcp-Session-Id'] = Crypto.randomUUID();
        }
        response.writeHead(HTTP_OK, headers);
        response.end(JSON.stringify(result));
      }
    },
    {
      method: 'GET',
      match: '/([^?]*)',
      custom: async ({ url }, _response, path) => {
        const filePath = Path.join(DOCS_DIR, path || 'index.md');
        const fileName = Path.basename(path || 'index.md');
        try {
          await FileSystem.access(filePath, FileSystem.constants.R_OK);
        } catch {
          return 404;
        }
        if (url?.endsWith('?raw')) {
          const content = await FileSystem.readFile(filePath, 'utf8');
          return [content, { headers: { 'content-type': 'text/markdown' } }];
        }
        return [
          `<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script>
  fetch('${fileName}?raw')
    .then(response => response.text())
    .then(content => {
      document.body.innerHTML = marked.parse(content);
    })
</script>`,
          {
            headers: {
              'content-type': 'text/html'
            }
          }
        ];
      }
    },
    {
      status: 404
    }
  ]
});
