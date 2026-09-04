import { it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../platform/index.js';
import { handleConsoleMessage } from './consoleMessage.js';
import { agentLogPrefix } from '../types/AgentState.js';

const PAGE_ID = 0;
const MESSAGE = 'Hello World !';

beforeEach(() => vi.clearAllMocks());

for (const [type, method] of [
  ['error', 'error'],
  ['warn', 'warn'],
  ['assert', 'warn'],
  ['debug', 'debug']
] as const) {
  it(`routes console type '${type}' to logger.${method}`, () => {
    handleConsoleMessage(type, MESSAGE, PAGE_ID);
    expect(logger[method]).toHaveBeenCalledWith({
      source: 'browser/console',
      message: MESSAGE,
      pageId: PAGE_ID,
      data: { type }
    });
  });
}

it('routes unknown console types to logger.info', () => {
  handleConsoleMessage('log', MESSAGE, PAGE_ID);
  expect(logger.info).toHaveBeenCalledWith({
    source: 'browser/console',
    message: MESSAGE,
    pageId: PAGE_ID,
    data: { type: 'log' }
  });
});

it('routes prefixed messages to browser/agent source and strips the prefix', () => {
  handleConsoleMessage('debug', `${agentLogPrefix}${MESSAGE}`, PAGE_ID);
  expect(logger.debug).toHaveBeenCalledWith({
    source: 'browser/agent',
    message: MESSAGE,
    pageId: PAGE_ID,
    data: { type: 'debug' }
  });
});

it('routes prefixed warn messages to browser/agent source', () => {
  handleConsoleMessage('warn', `${agentLogPrefix}${MESSAGE}`, PAGE_ID);
  expect(logger.warn).toHaveBeenCalledWith({
    source: 'browser/agent',
    message: MESSAGE,
    pageId: PAGE_ID,
    data: { type: 'warn' }
  });
});

it('routes prefixed error messages to browser/agent source', () => {
  handleConsoleMessage('error', `${agentLogPrefix}${MESSAGE}`, PAGE_ID);
  expect(logger.error).toHaveBeenCalledWith({
    source: 'browser/agent',
    message: MESSAGE,
    pageId: PAGE_ID,
    data: { type: 'error' }
  });
});
