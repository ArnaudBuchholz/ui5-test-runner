import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TestReportBuilder } from '../../utils/shared/TestReportBuilder.js';
import type { BrowserCapabilities } from '../../browsers/IBrowser.js';

vi.mock('../../reports/initReportBuilder.js', () => ({
  initReportBuilder: vi.fn()
}));

const CAPABILITIES: BrowserCapabilities = {
  browserName: 'chrome',
  browserVersion: '120',
  screenshotFormat: 'png'
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getReportBuilder', () => {
  it('throws when called before init', async () => {
    vi.resetModules();
    const { getReportBuilder } = await import('./report.js');
    expect(() => getReportBuilder()).toThrow();
  });
});

describe('initReportBuilder', () => {
  it('stores the builder returned by buildReportBuilder and getReportBuilder returns it', async () => {
    vi.resetModules();
    const { initReportBuilder, getReportBuilder } = await import('./report.js');
    const { initReportBuilder: buildReportBuilderFunction } = await import('../../reports/initReportBuilder.js');
    const fakeBuilder = { report: { results: { environment: { extra: {} } } } } as unknown as TestReportBuilder;
    vi.mocked(buildReportBuilderFunction).mockResolvedValue(fakeBuilder);
    await initReportBuilder({} as never);
    expect(getReportBuilder()).toBe(fakeBuilder);
  });
});

describe('setReportBrowserInfo', () => {
  it('sets browserName and browserVersion when environment is present', async () => {
    vi.resetModules();
    const { initReportBuilder, getReportBuilder, setReportBrowserInfo } = await import('./report.js');
    const { initReportBuilder: buildReportBuilderFunction } = await import('../../reports/initReportBuilder.js');
    const fakeBuilder = {
      report: { results: { environment: { extra: {} } } },
      merge: vi.fn()
    } as unknown as TestReportBuilder;
    vi.mocked(buildReportBuilderFunction).mockResolvedValue(fakeBuilder);
    await initReportBuilder({} as never);
    setReportBrowserInfo(CAPABILITIES);
    expect(getReportBuilder().report.results.environment?.extra).toMatchObject({
      browserName: 'chrome',
      browserVersion: '120'
    });
  });

  it('is a no-op when environment is undefined', async () => {
    vi.resetModules();
    const { initReportBuilder, setReportBrowserInfo } = await import('./report.js');
    const { initReportBuilder: buildReportBuilderFunction } = await import('../../reports/initReportBuilder.js');
    const sentinel = Symbol('unchanged');
    const fakeBuilder = {
      report: { results: { environment: undefined } },
      merge: vi.fn(),
      _sentinel: sentinel
    } as unknown as TestReportBuilder;
    vi.mocked(buildReportBuilderFunction).mockResolvedValue(fakeBuilder);
    await initReportBuilder({} as never);
    expect(() => setReportBrowserInfo(CAPABILITIES)).not.toThrow();
    expect(fakeBuilder.report.results.environment).toBeUndefined();
  });
});

// Keep a reference to the mock import for the last describe block
describe('initReportBuilder', () => {
  it('calls buildReportBuilder with the given configuration', async () => {
    vi.resetModules();
    const { initReportBuilder } = await import('./report.js');
    const { initReportBuilder: buildReportBuilderFunction } = await import('../../reports/initReportBuilder.js');
    const fakeBuilder = { report: { results: {} } } as unknown as TestReportBuilder;
    vi.mocked(buildReportBuilderFunction).mockResolvedValue(fakeBuilder);
    const config = { reportDir: '/tmp/report' } as never;
    await initReportBuilder(config);
    expect(buildReportBuilderFunction).toHaveBeenCalledWith(config);
  });
});
