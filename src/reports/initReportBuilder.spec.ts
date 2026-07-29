import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Host } from '../platform/index.js';
import type { Configuration } from '../configuration/Configuration.js';
import { initReportBuilder } from './initReportBuilder.js';

vi.mock('../platform/mock.js');
vi.mock('../utils/node/anonymize.js', () => ({ anonymize: (x: unknown) => x }));

const NO_CONFIGURATION = {} as unknown as Configuration;

const OS_PLATFORM = 'linux';
const OS_RELEASE = '5.15.0';
const OS_VERSION = '#1 SMP';
const MACHINE = 'x86_64';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Host.platform).mockReturnValue(OS_PLATFORM);
  vi.mocked(Host.osRelease).mockReturnValue(OS_RELEASE);
  vi.mocked(Host.osVersion).mockReturnValue(OS_VERSION);
  vi.mocked(Host.machine).mockReturnValue(MACHINE);
  vi.mocked(Host.cpus).mockReturnValue([]);
});

describe('initReportBuilder()', () => {
  it('sets reportFormat to CTRF', async () => {
    const { report } = await initReportBuilder(NO_CONFIGURATION);
    expect(report.reportFormat).toBe('CTRF');
  });

  it('sets specVersion to pre-1.0', async () => {
    const { report } = await initReportBuilder(NO_CONFIGURATION);
    expect(report.specVersion).toBe('pre-1.0');
  });

  it('sets generatedBy to the full version string', async () => {
    const { report } = await initReportBuilder(NO_CONFIGURATION);
    expect(report.generatedBy).toBe('ui5-test-runner@1.2.3');
  });

  it('sets results.tool.name to the package name', async () => {
    const { report } = await initReportBuilder(NO_CONFIGURATION);
    expect(report.results.tool.name).toBe('ui5-test-runner');
  });

  it('sets results.tool.version to the version number', async () => {
    const { report } = await initReportBuilder(NO_CONFIGURATION);
    expect(report.results.tool.version).toBe('1.2.3');
  });

  it('sets results.environment.osPlatform from Host.platform()', async () => {
    const { report } = await initReportBuilder(NO_CONFIGURATION);
    expect(report.results.environment?.osPlatform).toBe(OS_PLATFORM);
  });

  it('sets results.environment.osRelease from Host.osRelease()', async () => {
    const { report } = await initReportBuilder(NO_CONFIGURATION);
    expect(report.results.environment?.osRelease).toBe(OS_RELEASE);
  });

  it('sets results.environment.osVersion from Host.osVersion()', async () => {
    const { report } = await initReportBuilder(NO_CONFIGURATION);
    expect(report.results.environment?.osVersion).toBe(OS_VERSION);
  });

  it('sets results.environment.extra.machine from Host.machine()', async () => {
    const { report } = await initReportBuilder(NO_CONFIGURATION);
    expect(report.results.environment?.extra?.['machine']).toBe(MACHINE);
  });

  it('sets results.environment.extra.cpus from Host.cpus()', async () => {
    const { report } = await initReportBuilder(NO_CONFIGURATION);
    expect(report.results.environment?.extra?.['cpus']).toStrictEqual([]);
  });

  it('sets report.extra.configuration to the anonymized configuration', async () => {
    const { report } = await initReportBuilder(NO_CONFIGURATION);
    expect(report.extra?.['configuration']).toStrictEqual(NO_CONFIGURATION);
  });

  it('sets results.summary to zero-filled defaults', async () => {
    const { report } = await initReportBuilder(NO_CONFIGURATION);
    const { tests, passed, failed, skipped, pending, other } = report.results.summary;
    expect({ tests, passed, failed, skipped, pending, other }).toStrictEqual({
      tests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      pending: 0,
      other: 0
    });
  });

  it('sets results.tests to an empty array', async () => {
    const { report } = await initReportBuilder(NO_CONFIGURATION);
    expect(report.results.tests).toStrictEqual([]);
  });

  it('sets a string reportId and a string timestamp', async () => {
    const { report } = await initReportBuilder(NO_CONFIGURATION);
    expect(typeof report.reportId).toBe('string');
    expect(typeof report.timestamp).toBe('string');
  });
});
