import { describe, it, expect } from 'vitest';
import { escapeHtml } from './escapeHtml.js';

describe('escapeHtml', () => {
  it('leaves plain text untouched', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml('<a href="x" title=\'y\'>&</a>')).toBe("&lt;a href=&quot;x&quot; title='y'&gt;&amp;&lt;/a&gt;");
  });

  it('escapes ampersands before other entities so output is not double-escaped', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });
});
