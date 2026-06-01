import { it, expect, vi } from 'vitest';
import { log } from './log.js';
import { agentLogPrefix } from '../types/AgentState.js';

const debug = vi.spyOn(console, 'debug');
const error = vi.spyOn(console, 'error');

it('logs using a special syntax', () => {
  log('test');
  expect(debug).toHaveBeenCalledWith(`${agentLogPrefix}test`);
});

it('enables logging of errors', () => {
  log.error('failed');
  expect(error).toHaveBeenCalledWith(`${agentLogPrefix}failed`);
});
