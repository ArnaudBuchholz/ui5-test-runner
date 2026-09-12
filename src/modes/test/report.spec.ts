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

let initReportBuilder: (config: never) => Promise<void>;
let getReportBuilder: () => TestReportBuilder;
let setReportBrowserInfo: (capabilities: BrowserCapabilities) => void;
let buildReportBuilderFunction: (config: never) => Promise<TestReportBuilder>;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  const reportModule = await import('./report.js');
  initReportBuilder = reportModule.initReportBuilder;
  getReportBuilder = reportModule.getReportBuilder;
  setReportBrowserInfo = reportModule.setReportBrowserInfo;
  const initReportBuilderModule = await import('../../reports/initReportBuilder.js');
  buildReportBuilderFunction = initReportBuilderModule.initReportBuilder;
});

describe('getReportBuilder', () => {
  it('throws when called before init', () => {
    expect(() => getReportBuilder()).toThrow();
  });
});

describe('initReportBuilder', () => {
  it('stores the builder returned by buildReportBuilder and getReportBuilder returns it', async () => {
    const fakeBuilder = { report: { results: { environment: { extra: {} } } } } as unknown as TestReportBuilder;
    vi.mocked(buildReportBuilderFunction).mockResolvedValue(fakeBuilder);
    await initReportBuilder({} as never);
    expect(getReportBuilder()).toBe(fakeBuilder);
  });

  it('calls buildReportBuilder with the given configuration', async () => {
    const fakeBuilder = { report: { results: {} } } as unknown as TestReportBuilder;
    vi.mocked(buildReportBuilderFunction).mockResolvedValue(fakeBuilder);
    const config = { reportDir: '/tmp/report' } as never;
    await initReportBuilder(config);
    expect(buildReportBuilderFunction).toHaveBeenCalledWith(config);
  });
});

describe('setReportBrowserInfo', () => {
  it('sets browserName and browserVersion when environment is present', async () => {
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
