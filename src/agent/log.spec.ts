import { it, expect, vi } from 'vitest';
import { agentLogPrefix } from '../types/AgentState.js';

const debug = vi.spyOn(console, 'debug');
debug.mockImplementation(() => {});
const error = vi.spyOn(console, 'error');
error.mockImplementation(() => {});

const { log } = await import('./log.js');

it('logs using a special syntax', () => {
  log('test');
  expect(debug).toHaveBeenCalledWith(`${agentLogPrefix}test`);
});

it('enables logging of errors', () => {
  log.error('failed');
  expect(error).toHaveBeenCalledWith(`${agentLogPrefix}failed`);
});
