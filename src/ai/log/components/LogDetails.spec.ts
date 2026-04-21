import { describe, it, expect } from 'vitest';
import { renderLogDetails } from './LogDetails.js';
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

describe('renderLogDetails', () => {
  it('renders filter buttons with correct data-field for level', () => {
    const html = renderLogDetails(baseLog);
    expect(html).toContain('data-field="level"');
    expect(html).toContain('data-op="==="');
    expect(html).toContain('data-op="!=="');
  });

  it('renders filter buttons with correct data-field for source', () => {
    const html = renderLogDetails(baseLog);
    expect(html).toContain('data-field="source"');
    expect(html).toContain('"job"');
  });

  it('renders filter buttons with correct data-field for processId', () => {
    const html = renderLogDetails(baseLog);
    expect(html).toContain('data-field="processId"');
  });

  it('renders filter buttons with correct data-field for threadId', () => {
    const html = renderLogDetails(baseLog);
    expect(html).toContain('data-field="threadId"');
  });

  it('does not render error section when log has no error', () => {
    const html = renderLogDetails(baseLog);
    expect(html).not.toContain('error (JSON)');
  });

  it('renders error section as read-only JSON when error is present', () => {
    const log: InternalLogAttributes = {
      ...baseLog,
      source: 'job',
      error: { name: 'Error', message: 'something went wrong' }
    };
    const html = renderLogDetails(log);
    expect(html).toContain('error (JSON)');
    expect(html).toContain('something went wrong');
    expect(html).not.toContain('data-field="error"');
  });

  it('does not render data section when log has no data', () => {
    const html = renderLogDetails(baseLog);
    expect(html).not.toContain('data (JSON)');
  });

  it('renders data fields with dot-notation paths when data is present', () => {
    const log: InternalLogAttributes = {
      ...baseLog,
      source: 'job',
      data: { testName: 'open app', durationMs: 241 }
    };
    const html = renderLogDetails(log);
    expect(html).toContain('data.testName');
    expect(html).toContain('data.durationMs');
    expect(html).toContain('data-field="data.testName"');
  });

  it('recurses into nested objects using dot notation', () => {
    const log: InternalLogAttributes = {
      ...baseLog,
      data: { meta: { browser: 'chromium', retry: 0 } }
    };
    const html = renderLogDetails(log);
    expect(html).toContain('data.meta.browser');
    expect(html).toContain('data.meta.retry');
    expect(html).toContain('data-field="data.meta.browser"');
  });

  it('renders array elements with index notation', () => {
    const log: InternalLogAttributes = {
      ...baseLog,
      data: { items: ['a', 'b'] }
    };
    const html = renderLogDetails(log);
    expect(html).toContain('data.items[0]');
    expect(html).toContain('data.items[1]');
  });

  it('does not render isMainThread', () => {
    const html = renderLogDetails({ ...baseLog, isMainThread: true });
    expect(html).not.toContain('isMainThread');
    expect(html).not.toContain('mainThread');
  });

  it('renders filter-add-btn and filter-remove-btn classes', () => {
    const html = renderLogDetails(baseLog);
    expect(html).toContain('class="filter-add-btn"');
    expect(html).toContain('class="filter-remove-btn"');
  });
});
