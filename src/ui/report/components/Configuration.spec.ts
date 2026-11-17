import { describe, it, expect } from 'vitest';
import { renderConfiguration } from './Configuration.js';
import { stateFromTests } from './testFixture.js';

describe('renderConfiguration', () => {
  it('renders nothing when there is no configuration', () => {
    expect(renderConfiguration(stateFromTests([{ status: 'passed' }]))).toBe('');
  });

  it('renders a collapsed, pretty-printed configuration panel', () => {
    const state = stateFromTests([{ status: 'passed' }], { configuration: { parallel: 4, ci: true } });
    const html = renderConfiguration(state);
    expect(html).toContain('id="configToggle"');
    expect(html).toContain('style="display:none"');
    expect(html).toContain('&quot;parallel&quot;: 4');
  });

  it('escapes HTML in configuration values', () => {
    const state = stateFromTests([{ status: 'passed' }], { configuration: { url: '<script>' } });
    const html = renderConfiguration(state);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});
