import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { mock } from 'reserve';
import type { Configuration } from '../../configuration/Configuration.js';
import { buildREserveConfiguration } from './REserve.js';
import { FileSystem, Process } from '../../platform/index.js';

vi.mock(import('../../platform/mock.js'));

const CONFIGURATION = { port: 3000 } as unknown as Configuration;

const post = (server: ReturnType<typeof mock>, body: object, headers: Record<string, string> = {}) =>
  server.request('POST', '/mcp', headers, JSON.stringify(body));

let server: ReturnType<typeof mock>;

beforeAll(async () => {
  server = mock(buildREserveConfiguration(CONFIGURATION));
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  server.on('ready', () => resolve()).on('error', (error: unknown) => reject(error));
  await promise;
});

beforeEach(() => vi.clearAllMocks());

const ID = 1;

describe('GET /mcp', () => {
  it('returns 405', async () => {
    const response = await server.request('GET', '/mcp');
    await response.waitForFinish();
    expect(response.statusCode).toBe(405);
  });
});

describe('POST /mcp with invalid JSON', () => {
  it('returns 400', async () => {
    const response = await server.request('POST', '/mcp', {}, 'not json');
    await response.waitForFinish();
    expect(response.statusCode).toBe(400);
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { error: { code: number } };
    expect(body.error.code).toBe(-32_700);
  });
});

describe('initialize', () => {
  it('returns server info and capabilities', async () => {
    const response = await post(server, { jsonrpc: '2.0', id: ID, method: 'initialize', params: {} });
    await response.waitForFinish();
    expect(response.statusCode).toBe(200);
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { result: { serverInfo: { name: string }; capabilities: object } };
    expect(body.result.serverInfo.name).toBe('ui5-test-runner');
    expect(body.result.capabilities).toHaveProperty('tools');
  });
});

describe('tools/list', () => {
  it('returns the three tools', async () => {
    const response = await post(server, { jsonrpc: '2.0', id: ID, method: 'tools/list' });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { result: { tools: Array<{ name: string }> } };
    const names = body.result.tools.map((t) => t.name);
    expect(names).toContain('list_topics');
    expect(names).toContain('get_topic');
    expect(names).toContain('run');
  });
});

describe('tools/call list_topics', () => {
  it('returns the root index content', async () => {
    vi.mocked(FileSystem.readFile).mockResolvedValue('- [[options]]\n- [[coverage]]');
    const response = await post(server, {
      jsonrpc: '2.0',
      id: ID,
      method: 'tools/call',
      params: { name: 'list_topics', arguments: {} }
    });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { result: { content: Array<{ text: string }> } };
    expect(body.result.content[0]!.text).toContain('[[options]]');
    expect(body.result.content[0]!.text).toContain('[[coverage]]');
  });
});

describe('tools/call get_topic', () => {
  it('returns file content for a known topic', async () => {
    vi.mocked(FileSystem.readFile).mockResolvedValue('# Installation\nSome content with [[options]]');
    const response = await post(server, {
      jsonrpc: '2.0',
      id: ID,
      method: 'tools/call',
      params: { name: 'get_topic', arguments: { topic: 'installation' } }
    });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { result: { content: Array<{ text: string }> } };
    expect(body.result.content[0]!.text).toContain('[[options]]');
  });

  it('returns not found message for unknown topic', async () => {
    vi.mocked(FileSystem.readFile).mockRejectedValue(new Error('ENOENT'));
    const response = await post(server, {
      jsonrpc: '2.0',
      id: ID,
      method: 'tools/call',
      params: { name: 'get_topic', arguments: { topic: 'unknown' } }
    });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { result: { content: Array<{ text: string }> } };
    expect(body.result.content[0]!.text).toContain('"unknown" not found');
  });
});

describe('tools/call run', () => {
  it('returns stdout, stderr and exit code', async () => {
    const MOCK_PROCESS = {
      closed: Promise.resolve(),
      stdout: 'Tests passed\n',
      stderr: '',
      code: 0
    };
    vi.mocked(Process.spawn).mockReturnValue(MOCK_PROCESS as never);
    const response = await post(server, {
      jsonrpc: '2.0',
      id: ID,
      method: 'tools/call',
      params: { name: 'run', arguments: { args: ['--help'] } }
    });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { result: { content: Array<{ text: string }> } };
    expect(body.result.content[0]!.text).toContain('Exit code: 0');
    expect(body.result.content[0]!.text).toContain('Tests passed');
  });
});

describe('tools/call unknown tool', () => {
  it('returns method not found error', async () => {
    const response = await post(server, {
      jsonrpc: '2.0',
      id: ID,
      method: 'tools/call',
      params: { name: 'nonexistent', arguments: {} }
    });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { error: { code: number } };
    expect(body.error.code).toBe(-32_601);
  });
});

describe('tools/call failing tool', () => {
  it('returns isError result with error message', async () => {
    vi.mocked(FileSystem.readFile).mockRejectedValue(new Error('disk failure'));
    const response = await post(server, {
      jsonrpc: '2.0',
      id: ID,
      method: 'tools/call',
      params: { name: 'list_topics', arguments: {} }
    });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { result: { isError: boolean; content: Array<{ text: string }> } };
    expect(body.result.isError).toBe(true);
    expect(body.result.content[0]!.text).toContain('disk failure');
  });
});

describe('unknown method', () => {
  it('returns method not found error', async () => {
    const response = await post(server, { jsonrpc: '2.0', id: ID, method: 'unknown/method' });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { error: { code: number } };
    expect(body.error.code).toBe(-32_601);
  });
});

describe('origin validation', () => {
  it('returns 403 when origin does not match', async () => {
    const response = await post(
      server,
      { jsonrpc: '2.0', id: ID, method: 'initialize' },
      { origin: 'https://evil.example.com' }
    );
    await response.waitForFinish();
    expect(response.statusCode).toBe(403);
  });
});
