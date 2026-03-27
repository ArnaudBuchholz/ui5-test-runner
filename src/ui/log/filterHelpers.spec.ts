import { describe, it, expect } from 'vitest';
import { buildIncludeFilter, buildExcludeFilter, appendFilter, searchEntries } from './filterHelpers.js';
import type { LogEntry } from './types.js';
import { LogLevel } from '../../platform/logger/types.js';

const makeEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  timestamp: 1_000_000,
  level: LogLevel.info,
  processId: 1,
  threadId: 0,
  isMainThread: true,
  source: 'job',
  message: 'Creating folder',
  ...overrides
});

describe('buildIncludeFilter', () => {
  it('builds equality filter for source', () => {
    expect(buildIncludeFilter('source', 'job')).toBe('source === "job"');
  });

  it('builds includes filter for message', () => {
    expect(buildIncludeFilter('message', 'folder')).toBe('message.includes("folder")');
  });

  it('builds level equality using level name', () => {
    expect(buildIncludeFilter('level', LogLevel.info)).toBe('level === "info"');
  });

  it('builds equality filter for processId', () => {
    expect(buildIncludeFilter('processId', 16_616)).toBe('processId === 16616');
  });
});

describe('buildExcludeFilter', () => {
  it('builds not-equal filter for source', () => {
    expect(buildExcludeFilter('source', 'job')).toBe('source !== "job"');
  });

  it('builds negated includes filter for message', () => {
    expect(buildExcludeFilter('message', 'folder')).toBe('!message.includes("folder")');
  });

  it('builds level not-equal using level name', () => {
    expect(buildExcludeFilter('level', LogLevel.warn)).toBe('level !== "warn"');
  });
});

describe('appendFilter', () => {
  it('returns the addition when existing is empty', () => {
    expect(appendFilter('', 'source === "job"')).toBe('source === "job"');
  });

  it('combines existing and new with &&', () => {
    expect(appendFilter('level === "info"', 'source === "job"')).toBe('level === "info" && source === "job"');
  });

  it('trims whitespace from existing before combining', () => {
    expect(appendFilter('  level === "info"  ', 'source === "job"')).toBe('level === "info" && source === "job"');
  });
});

describe('searchEntries', () => {
  const entries: LogEntry[] = [
    makeEntry({ message: 'Creating folder: /tmp', source: 'job' }),
    makeEntry({ message: 'Test took longer than expected', source: 'qunit' }),
    makeEntry({ message: 'Failed to load resource', source: 'browser' })
  ];

  it('returns all entries when search text is empty', () => {
    expect(searchEntries(entries, '')).toHaveLength(3);
  });

  it('filters by message substring (case-insensitive)', () => {
    const result = searchEntries(entries, 'folder');
    expect(result).toHaveLength(1);
    expect(result[0].message).toBe('Creating folder: /tmp');
  });

  it('filters by source substring (case-insensitive)', () => {
    const result = searchEntries(entries, 'QUNIT');
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('qunit');
  });

  it('returns empty array when no entries match', () => {
    expect(searchEntries(entries, 'nonexistent_xyz')).toHaveLength(0);
  });
});
