import { describe, it, expect } from 'vitest';
import { renderEventStream } from './EventStream.js';
import { renderEventDetails, escapeHtml } from './EventDetails.js';
import type { InternalLogAttributes } from '../../../platform/logger/types.js';

function log(partial: Partial<InternalLogAttributes>): InternalLogAttributes {
  return {
    timestamp: new Date(2024, 0, 15, 9, 8, 7, 42).getTime(),
    level: 1,
    processId: 100,
    threadId: 0,
    isMainThread: true,
    source: 'job',
    message: 'hello',
    ...partial
  } as InternalLogAttributes;
}

describe('escapeHtml', () => {
  it('escapes angle brackets, ampersands and quotes', () => {
    expect(escapeHtml('<a b="&">')).toBe('&lt;a b=&quot;&amp;&quot;&gt;');
  });
});

describe('renderEventStream', () => {
  it('shows an empty-state message with no logs', () => {
    expect(renderEventStream([], { order: 'desc', expandedIndex: -1 })).toContain('No events');
  });

  it('renders one row per log with its index', () => {
    const html = renderEventStream([log({ message: 'a' }), log({ message: 'b' })], {
      order: 'asc',
      expandedIndex: -1
    });
    expect(html).toContain('data-index="0"');
    expect(html).toContain('data-index="1"');
  });

  it('expands only the row at expandedIndex inline', () => {
    const html = renderEventStream([log({ message: 'a' }), log({ message: 'b', source: 'assert' })], {
      order: 'asc',
      expandedIndex: 1
    });
    expect(html).toContain('ev-row-detail');
    expect(html.match(/ev-row-detail/g)?.length).toBe(1);
  });

  it('applies the level class so errors are colour-coded', () => {
    const html = renderEventStream([log({ level: 3 })], { order: 'desc', expandedIndex: -1 });
    expect(html).toContain('ev-level-error');
  });

  it('reverses order when descending', () => {
    const html = renderEventStream([log({ message: 'first' }), log({ message: 'second' })], {
      order: 'desc',
      expandedIndex: -1
    });
    expect(html.indexOf('data-index="1"')).toBeLessThan(html.indexOf('data-index="0"'));
  });
});

describe('renderEventDetails', () => {
  it('renders core fields and escapes the message', () => {
    const html = renderEventDetails(log({ message: '<script>' }));
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('processId');
  });

  it('omits pageId row when absent and includes it when present', () => {
    expect(renderEventDetails(log({ pageId: undefined }))).not.toContain('>pageId<');
    expect(renderEventDetails(log({ pageId: 7 }))).toContain('pageId');
  });

  it('renders an error section when error is present', () => {
    const html = renderEventDetails(log({ error: new Error('boom') }));
    expect(html).toContain('ev-error');
    expect(html).toContain('boom');
  });

  it('walks the data payload into filterable key/value rows', () => {
    const html = renderEventDetails(log({ source: 'http', data: { requestId: 1, status: 200 } }));
    expect(html).toContain('data.requestId');
    expect(html).toContain('data.status');
    expect(html).toContain('ev-filter-btn');
  });
});
