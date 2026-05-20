import { describe, it, expect } from 'vitest';
import { renderHeader } from './Header.js';
import { getInitialLogMetrics } from '../../../modes/log/LogMetrics.js';

describe('renderHeader', () => {
  it('shows Live and Positive design when reading is true', () => {
    const metrics = { ...getInitialLogMetrics(), reading: true };
    const html = renderHeader(metrics);
    expect(html).toContain('Status: Live');
    expect(html).toContain('design="Positive"');
  });

  it('shows Replay and Neutral design when reading is false', () => {
    const metrics = { ...getInitialLogMetrics(), reading: false };
    const html = renderHeader(metrics);
    expect(html).toContain('Status: Replay');
    expect(html).toContain('design="Neutral"');
  });

  it('includes the statusBtn id', () => {
    const html = renderHeader(getInitialLogMetrics());
    expect(html).toContain('id="statusBtn"');
  });

  it('includes the application title', () => {
    const html = renderHeader(getInitialLogMetrics());
    expect(html).toContain('UI5 Test Runner Log Viewer');
  });
});
