import { it, expect, vi, beforeEach } from 'vitest';
import { logger } from './platform/index.js';
import { logReserve } from './reserveLogger.js';
import type { Server } from 'reserve';

const makeServer = () => {
  const listeners = new Map<string, (event: object) => void>();
  const server: Server = {
    on: (eventName: string, listener: (event: object) => void) => {
      listeners.set(eventName, listener);
      return server;
    }
  } as unknown as Server;
  return {
    server,
    emit: (eventName: string, data: object = {}) => listeners.get(eventName)?.({ eventName, ...data })
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

it('logs debug on created', () => {
  const { server, emit } = makeServer();
  logReserve(server);
  emit('created');
  expect(logger.debug).toHaveBeenCalledWith({ source: 'reserve', message: 'created', data: {} });
});

it('logs debug and info on ready', () => {
  const { server, emit } = makeServer();
  logReserve(server);
  emit('ready', { url: 'http://localhost:1234' });
  expect(logger.debug).toHaveBeenCalledWith({ source: 'reserve', message: 'ready', data: { url: 'http://localhost:1234' } });
  expect(logger.info).toHaveBeenCalledWith({ source: 'server', message: 'Server listening on: http://localhost:1234' });
});

it('logs debug on error', () => {
  const { server, emit } = makeServer();
  logReserve(server);
  const reason = new Error('oops');
  emit('error', { reason });
  expect(logger.debug).toHaveBeenCalledWith({ source: 'reserve', message: 'error', data: {}, error: reason });
});

for (const eventName of ['incoming', 'redirecting', 'redirected', 'aborted', 'closed'] as const) {
  it(`logs debug on ${eventName}`, () => {
    const { server, emit } = makeServer();
    logReserve(server);
    emit(eventName, { someField: 1 });
    expect(logger.debug).toHaveBeenCalledWith({ source: 'reserve', message: eventName, data: { someField: 1 } });
  });
}
