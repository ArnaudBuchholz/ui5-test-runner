import { describe, it, expect } from 'vitest';
import { buildCellActions } from './CellContextMenu.js';
import { LogLevel } from '../../../platform/logger/types.js';

describe('buildCellActions', () => {
  it('builds include and exclude actions for source', () => {
    const actions = buildCellActions('source', 'job');
    expect(actions).toHaveLength(2);
    expect(actions[0].expression).toBe('source === "job"');
    expect(actions[1].expression).toBe('source !== "job"');
  });

  it('builds level actions using the level name', () => {
    const actions = buildCellActions('level', LogLevel.info);
    expect(actions[0].expression).toBe('level === "info"');
    expect(actions[1].expression).toBe('level !== "info"');
  });

  it('adds a partial message.includes action when message has spaces', () => {
    const actions = buildCellActions('message', 'Creating folder: /Users/arnaud/tmp');
    expect(actions.length).toBeGreaterThan(2);
    const extra = actions.find((a) => a.expression.startsWith('message.includes'));
    expect(extra).toBeDefined();
  });

  it('does not add extra action for short single-word messages', () => {
    const actions = buildCellActions('message', 'timeout');
    expect(actions).toHaveLength(2);
  });
});
