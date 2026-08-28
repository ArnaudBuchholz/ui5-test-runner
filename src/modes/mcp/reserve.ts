import type { Configuration as REserveConfiguration } from 'reserve';
import { body } from 'reserve';
import type { Configuration } from '../../configuration/Configuration.js';
import { TOOLS } from './tools/index.js';

const SERVER_INFO = {
  name: 'ui5-test-runner',
  version: '1.0.0'
};

const HTTP_OK = 200;
// const HTTP_FORBIDDEN = 403;
const HTTP_METHOD_NOT_ALLOWED = 405;
const HTTP_BAD_REQUEST = 400;

const JSONRPC_PARSE_ERROR = -32_700;
const JSONRPC_METHOD_NOT_FOUND = -32_601;

type JsonRpcHeader = {
  jsonrpc: '2.0';
  id: string | number | null;
};

type JsonRpcRequest = JsonRpcHeader & {
  method: string;
  params?: unknown;
};

type JsonRpcResponse = JsonRpcHeader & {
  result?: unknown;
  error?: { code: number; message: string };
};

const buildError = (id: string | number | null, code: number, message: string): JsonRpcResponse => ({
  jsonrpc: '2.0',
  id,
  error: { code, message }
});

const handleRequest = async (body: JsonRpcRequest): Promise<JsonRpcResponse> => {
  const { id, method, params } = body;
  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        serverInfo: SERVER_INFO,
        capabilities: { tools: {} }
      }
    };
  }
  if (method === 'notifications/initialized') {
    return { jsonrpc: '2.0', id, result: {} };
  }
  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: Object.values(TOOLS).map((t) => t.definition) } };
  }
  if (method === 'tools/call') {
    const { name, arguments: toolArguments } = params as { name: string; arguments: Record<string, unknown> };
    const tool = TOOLS[name];
    if (!tool) {
      return buildError(id, JSONRPC_METHOD_NOT_FOUND, `Unknown tool: ${name}`);
    }
    let content: string;
    try {
      content = await tool.handler(toolArguments);
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
        // const origin = (request.headers as Record<string, string>)['origin'];
        // if (origin && origin !== `http://localhost:${configuration.port ?? 3000}`) {
        //   response.writeHead(HTTP_FORBIDDEN, { 'Content-Type': 'application/json' });
        //   response.end(JSON.stringify({ error: 'Forbidden' }));
        //   return;
        // }
        let parsed: JsonRpcRequest;
        try {
          parsed = (await body(request).json()) as JsonRpcRequest;
        } catch {
          response.writeHead(HTTP_BAD_REQUEST, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify(buildError(null, JSONRPC_PARSE_ERROR, 'Parse error')));
          return;
        }
        const result = await handleRequest(parsed);
        response.writeHead(HTTP_OK, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(result));
      }
    }
  ]
});
