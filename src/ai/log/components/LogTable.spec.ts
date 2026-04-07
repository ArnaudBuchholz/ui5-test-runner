import { describe, it, expect } from 'vitest';
import { renderLogTable } from './LogTable.js';
import type { InternalLogAttributes } from '../../../platform/logger/types.js';

const baseLog: InternalLogAttributes = {
  timestamp: 1_700_000_000_000,
  level: 1,
  processId: 100,
  threadId: 0,
  isMainThread: true,
  source: 'job',
  message: 'test message'
};

describe('renderLogTable', () => {
  it('renders "No log entries" when logs array is empty', () => {
    const html = renderLogTable([]);
    expect(html).toContain('No log entries');
  });

  it('renders correct level icon for each level', () => {
    const levels: [number, string][] = [
      [0, '🔍'],
      [1, '💬'],
      [2, '⚠️'],
      [3, '❌'],
      [4, '💣']
    ];
    for (const [level, icon] of levels) {
      const html = renderLogTable([{ ...baseLog, level: level as InternalLogAttributes['level'] }]);
      expect(html).toContain(icon);
    }
  });

  it('includes data-index attribute on rows', () => {
    const html = renderLogTable([baseLog, baseLog]);
    expect(html).toContain('data-index="0"');
    expect(html).toContain('data-index="1"');
  });

  it('truncates messages longer than 200 characters', () => {
    const longMessage = 'a'.repeat(250);
    const html = renderLogTable([{ ...baseLog, message: longMessage }]);
    expect(html).toContain('…');
    expect(html).not.toContain('a'.repeat(201));
  });

  it('does not render isMainThread', () => {
    const html = renderLogTable([{ ...baseLog, isMainThread: true }]);
    expect(html).not.toContain('isMainThread');
    expect(html).not.toContain('mainThread');
  });

  it('includes header columns', () => {
    const html = renderLogTable([]);
    expect(html).toContain('Timestamp');
    expect(html).toContain('Source');
    expect(html).toContain('Message');
  });
});
