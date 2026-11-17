import { describe, it, expect } from 'vitest';
import { renderHeader } from './Header.js';
import { stateFromTests } from './testFixture.js';

describe('renderHeader', () => {
  it('shows a passed pill when no test failed', () => {
    const html = renderHeader(stateFromTests([{ status: 'passed' }]));
    expect(html).toContain('pill--pass');
    expect(html).toContain('Passed');
    expect(html).not.toContain('pill--fail');
  });

  it('shows a failed pill when any test failed', () => {
    const html = renderHeader(stateFromTests([{ status: 'passed' }, { status: 'failed' }]));
    expect(html).toContain('pill--fail');
    expect(html).toContain('Failed');
  });

  it('renders the tool name and version', () => {
    const html = renderHeader(stateFromTests([{ status: 'passed' }]));
    expect(html).toContain('ui5-test-runner@6.0.0');
  });

  it('exposes open, export and theme controls', () => {
    const html = renderHeader(stateFromTests([{ status: 'passed' }]));
    expect(html).toContain('id="openBtn"');
    expect(html).toContain('id="exportBtn"');
    expect(html).toContain('id="themeBtn"');
  });
});
