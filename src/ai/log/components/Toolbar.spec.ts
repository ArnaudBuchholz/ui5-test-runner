import { describe, it, expect } from 'vitest';
import { renderToolbar } from './Toolbar.js';
import type { State } from '../../../modes/log/ui/types.js';
import {
  RELATIVE_TIMERANGE_SETTINGS,
  AUTO_REFRESH_SETTINGS,
  FIVE_MINUTES,
  FIVE_SECONDS
} from '../../../modes/log/ui/constants.js';

const settings = {
  relativeTimerange: RELATIVE_TIMERANGE_SETTINGS,
  autorefresh: AUTO_REFRESH_SETTINGS
};

const baseState: State = {
  timerangeType: 'relative',
  relativeTimerange: FIVE_MINUTES,
  absoluteTimerangeFrom: 1_700_000_000_000,
  absoluteTimerangeTo: 1_700_003_600_000,
  autorefresh: false,
  autorefreshInterval: FIVE_SECONDS,
  filter: '',
  errorMessage: '',
  logs: [],
  metrics: {
    inputSize: 0,
    chunksCount: 0,
    outputSize: 0,
    minTimestamp: 0,
    maxTimestamp: 0,
    logCount: 0,
    reading: true
  }
};

describe('renderToolbar', () => {
  describe('when timerangeType is relative', () => {
    it('renders relativeTimerangeSelect', () => {
      const html = renderToolbar(baseState, settings);
      expect(html).toContain('id="relativeTimerangeSelect"');
    });

    it('does not render absoluteFromPicker', () => {
      const html = renderToolbar(baseState, settings);
      expect(html).not.toContain('absoluteFromPicker');
    });

    it('renders the autorefresh select', () => {
      const html = renderToolbar(baseState, settings);
      expect(html).toContain('id="autorefreshSelect"');
    });

    it('renders the correct selected relative timerange option', () => {
      const html = renderToolbar({ ...baseState, relativeTimerange: 900_000 }, settings);
      expect(html).toContain(`value="900000" selected`);
    });
  });

  describe('when timerangeType is absolute', () => {
    const absoluteState = { ...baseState, timerangeType: 'absolute' as const };

    it('renders absoluteFromPicker', () => {
      const html = renderToolbar(absoluteState, settings);
      expect(html).toContain('id="absoluteFromPicker"');
    });

    it('renders absoluteToPicker', () => {
      const html = renderToolbar(absoluteState, settings);
      expect(html).toContain('id="absoluteToPicker"');
    });

    it('does not render relativeTimerangeSelect', () => {
      const html = renderToolbar(absoluteState, settings);
      expect(html).not.toContain('relativeTimerangeSelect');
    });

    it('does not render auto refresh controls', () => {
      const html = renderToolbar(absoluteState, settings);
      expect(html).not.toContain('autorefreshSelect');
    });
  });

  describe('error message', () => {
    it('renders errorStrip when errorMessage is non-empty', () => {
      const html = renderToolbar({ ...baseState, errorMessage: 'Invalid filter' }, settings);
      expect(html).toContain('id="errorStrip"');
      expect(html).toContain('Invalid filter');
    });

    it('does not render errorStrip when errorMessage is empty', () => {
      const html = renderToolbar(baseState, settings);
      expect(html).not.toContain('id="errorStrip"');
    });
  });

  describe('filter input', () => {
    it('renders the filter input with the current filter value', () => {
      const html = renderToolbar({ ...baseState, filter: 'level === "info"' }, settings);
      expect(html).toContain('id="filterInput"');
      expect(html).toContain('level === &quot;info&quot;');
    });

    it('escapes HTML in filter value', () => {
      const html = renderToolbar({ ...baseState, filter: '<script>' }, settings);
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>');
    });
  });

  it('always renders the refresh now button', () => {
    expect(renderToolbar(baseState, settings)).toContain('id="refreshNowBtn"');
    expect(renderToolbar({ ...baseState, timerangeType: 'absolute' }, settings)).toContain('id="refreshNowBtn"');
  });
});
