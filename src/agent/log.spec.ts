import { it, expect, vi } from 'vitest';
import { log } from './log.js';
import { agentLogPrefix } from '../types/AgentState.js';

const debug = vi.spyOn(console, 'debug');

it('logs using a special syntax', () => {
  log('test');
  expect(debug).toHaveBeenCalledWith(`${agentLogPrefix}test`);
});
