import type { AgentState } from '../types/AgentState.js';
import { state } from './state.js';

type QUnitState = Extract<AgentState, { type: 'QUnit' }>;

const updateState = (updates: Partial<QUnitState>) => {
  Object.assign(state, updates);
};

export const qunit = () => {
  state.type = 'QUnit';
  let executed = 0;

  QUnit.begin((details) =>
    updateState({
      isOpa: !!window?.sap?.ui?.test?.Opa5,
      executed,
      total: details.totalTests
    })
  );

  QUnit.testDone(() =>
    updateState({
      executed: ++executed
    })
  );

  QUnit.done(() =>
    updateState({
      done: true
    })
  );
};
