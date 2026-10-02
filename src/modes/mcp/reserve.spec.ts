import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { mock } from 'reserve';
import type { Configuration } from '../../configuration/Configuration.js';
import { buildREserveConfiguration } from './reserve.js';
import { Crypto } from '../../platform/index.js';
import * as knowledgeBase from './knowledgeBase.js';
import type { IEntity, IKnowledgeBaseIndex } from './knowledgeBase.js';

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

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Crypto.randomUUID).mockReturnValue('11111111-1111-1111-1111-111111111111');
});

const ENTITY: IEntity = {
  id: 'options/coverage',
  '#type': 'option',
  title: 'coverage',
  summary: 'enable code coverage',
  keywords: [],
  relations: {},
  sha: '0',
  path: 'options/coverage.md',
  body: '# Coverage'
};

const stubIndex = (overrides: Partial<IKnowledgeBaseIndex> = {}): void => {
  const index: IKnowledgeBaseIndex = {
    catalog: [{ id: ENTITY.id, '#type': ENTITY['#type'], title: ENTITY.title, summary: ENTITY.summary, relations: {} }],
    getEntity: (id) => (id === ENTITY.id ? ENTITY : undefined),
    getReverseRelations: () => [],
    ...overrides
  };
  vi.spyOn(knowledgeBase, 'getIndex').mockReturnValue(index);
};

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

  it('echoes a supported protocol version requested by the client', async () => {
    const response = await post(server, {
      jsonrpc: '2.0',
      id: ID,
      method: 'initialize',
      params: { protocolVersion: '2025-06-18' }
    });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { result: { protocolVersion: string } };
    expect(body.result.protocolVersion).toBe('2025-06-18');
  });

  it('negotiates down to the newest supported version when the client asks for an unknown one', async () => {
    const response = await post(server, {
      jsonrpc: '2.0',
      id: ID,
      method: 'initialize',
      params: { protocolVersion: '1999-01-01' }
    });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { result: { protocolVersion: string } };
    expect(body.result.protocolVersion).toBe('2025-06-18');
  });

  it('assigns an Mcp-Session-Id header', async () => {
    const response = await post(server, { jsonrpc: '2.0', id: ID, method: 'initialize', params: {} });
    await response.waitForFinish();
    expect(response.headers['mcp-session-id']).toBe('11111111-1111-1111-1111-111111111111');
  });
});

describe('notification', () => {
  it('returns 202 Accepted with no body for an id-less message', async () => {
    const response = await post(server, { jsonrpc: '2.0', method: 'notifications/initialized' });
    await response.waitForFinish();
    expect(response.statusCode).toBe(202);
  });
});

describe('ping', () => {
  it('returns an empty result', async () => {
    const response = await post(server, { jsonrpc: '2.0', id: ID, method: 'ping' });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { result: object };
    expect(body.result).toStrictEqual({});
  });
});

describe('resources/list', () => {
  it('returns an empty list', async () => {
    const response = await post(server, { jsonrpc: '2.0', id: ID, method: 'resources/list' });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { result: { resources: unknown[] } };
    expect(body.result.resources).toStrictEqual([]);
  });
});

describe('prompts/list', () => {
  it('returns an empty list', async () => {
    const response = await post(server, { jsonrpc: '2.0', id: ID, method: 'prompts/list' });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { result: { prompts: unknown[] } };
    expect(body.result.prompts).toStrictEqual([]);
  });
});

describe('tools/list', () => {
  it('returns the two tools', async () => {
    const response = await post(server, { jsonrpc: '2.0', id: ID, method: 'tools/list' });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { result: { tools: Array<{ name: string }> } };
    const names = body.result.tools.map((t) => t.name);
    expect(names).toContain('list_topics');
    expect(names).toContain('get_topic');
  });
});

describe('tools/call list_topics', () => {
  it('returns the catalog as JSON', async () => {
    stubIndex();
    const response = await post(server, {
      jsonrpc: '2.0',
      id: ID,
      method: 'tools/call',
      params: { name: 'list_topics', arguments: {} }
    });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { result: { content: Array<{ text: string }> } };
    const catalog = JSON.parse(body.result.content[0]!.text) as Array<{ id: string }>;
    expect(catalog[0]!.id).toBe('options/coverage');
  });
});

describe('tools/call get_topic', () => {
  it('returns the entity body for a known id', async () => {
    stubIndex();
    const response = await post(server, {
      jsonrpc: '2.0',
      id: ID,
      method: 'tools/call',
      params: { name: 'get_topic', arguments: { id: 'options/coverage' } }
    });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { result: { content: Array<{ text: string }> } };
    expect(body.result.content[0]!.text).toContain('# Coverage');
  });

  it('returns a not-found message for an unknown id', async () => {
    stubIndex();
    const response = await post(server, {
      jsonrpc: '2.0',
      id: ID,
      method: 'tools/call',
      params: { name: 'get_topic', arguments: { id: 'does/not/exist' } }
    });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { result: { content: Array<{ text: string }> } };
    expect(body.result.content[0]!.text).toContain('No topic found for id "does/not/exist"');
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

describe('tools/call with malformed params', () => {
  it('returns an invalid-params error', async () => {
    const response = await post(server, {
      jsonrpc: '2.0',
      id: ID,
      method: 'tools/call',
      params: { name: 'list_topics' }
    });
    await response.waitForFinish();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- REserve response body
    const body = JSON.parse(response.toString()) as { error: { code: number } };
    expect(body.error.code).toBe(-32_602);
  });
});

describe('tools/call failing tool', () => {
  it('returns isError result with error message', async () => {
    vi.spyOn(knowledgeBase, 'getIndex').mockImplementation(() => {
      throw new Error('disk failure');
    });
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

// describe('origin validation', () => {
//   it('returns 403 when origin does not match', async () => {
//     const response = await post(
//       server,
//       { jsonrpc: '2.0', id: ID, method: 'initialize' },
//       { origin: 'https://evil.example.com' }
//     );
//     await response.waitForFinish();
//     expect(response.statusCode).toBe(403);
//   });
// });
