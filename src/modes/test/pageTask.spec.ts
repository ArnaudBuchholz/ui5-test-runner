import { describe, it, expect } from 'vitest';
import { agentStateMessage } from './pageTask.js';
import type { AgentState } from '../../types/AgentState.js';

const LOADING_STATE = { done: false, type: undefined } satisfies AgentState;
const UNKNOWN_STATE = { done: false, type: 'unknown' } satisfies AgentState;
const SUITE_STATE = { done: true, type: 'suite', pages: ['/a.html', '/b.html'] } satisfies AgentState;
const QUNIT_IN_PROGRESS = {
  done: false,
  type: 'QUnit',
  isOpa: false,
  executed: 3,
  errors: 0,
  total: 10
} satisfies AgentState;
const QUNIT_DONE = { done: true, type: 'QUnit', isOpa: false, executed: 10, errors: 0, total: 10 } satisfies AgentState;
const OPA_IN_PROGRESS = {
  done: false,
  type: 'QUnit',
  isOpa: true,
  executed: 1,
  errors: 0,
  total: 5
} satisfies AgentState;

describe('agentStateMessage', () => {
  it('returns loading when type is undefined', () => {
    expect(agentStateMessage(LOADING_STATE)).toBe('agent state: loading');
  });

  it('returns unknown when type is unknown', () => {
    expect(agentStateMessage(UNKNOWN_STATE)).toBe('agent state: unknown');
  });

  it('returns suite done', () => {
    expect(agentStateMessage(SUITE_STATE)).toBe('agent state: suite done');
  });

  it('returns QUnit progress when not done', () => {
    expect(agentStateMessage(QUNIT_IN_PROGRESS)).toBe('agent state: QUnit 3/10');
  });

  it('returns QUnit done with final counts', () => {
    expect(agentStateMessage(QUNIT_DONE)).toBe('agent state: QUnit done 10/10');
  });

  it('returns OPA progress for OPA tests', () => {
    expect(agentStateMessage(OPA_IN_PROGRESS)).toBe('agent state: OPA 1/5');
  });
});
