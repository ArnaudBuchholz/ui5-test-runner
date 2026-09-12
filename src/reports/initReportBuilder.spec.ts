import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Host } from '../platform/index.js';
import type { Configuration } from '../configuration/Configuration.js';
import type { TestReportBuilder } from '../utils/shared/TestReportBuilder.js';
import { initReportBuilder } from './initReportBuilder.js';

vi.mock('../utils/node/anonymize.js', () => ({ anonymize: (x: unknown) => x }));

const NO_CONFIGURATION = {} as unknown as Configuration;

const OS_PLATFORM = 'linux';
const OS_RELEASE = '5.15.0';
const OS_VERSION = '#1 SMP';
const MACHINE = 'x86_64';

let builder: TestReportBuilder;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.mocked(Host.platform).mockReturnValue(OS_PLATFORM);
  vi.mocked(Host.osRelease).mockReturnValue(OS_RELEASE);
  vi.mocked(Host.osVersion).mockReturnValue(OS_VERSION);
  vi.mocked(Host.machine).mockReturnValue(MACHINE);
  vi.mocked(Host.cpus).mockReturnValue([]);
  builder = await initReportBuilder(NO_CONFIGURATION);
});

describe('initReportBuilder()', () => {
  it('sets reportFormat to CTRF', () => {
    expect(builder.report.reportFormat).toBe('CTRF');
  });

  it('sets specVersion to pre-1.0', () => {
    expect(builder.report.specVersion).toBe('pre-1.0');
  });

  it('sets generatedBy to the full version string', () => {
    expect(builder.report.generatedBy).toBe('ui5-test-runner@1.2.3');
  });

  it('sets results.tool.name to the package name', () => {
    expect(builder.report.results.tool.name).toBe('ui5-test-runner');
  });

  it('sets results.tool.version to the version number', () => {
    expect(builder.report.results.tool.version).toBe('1.2.3');
  });

  it('sets results.environment.osPlatform from Host.platform()', () => {
    expect(builder.report.results.environment?.osPlatform).toBe(OS_PLATFORM);
  });

  it('sets results.environment.osRelease from Host.osRelease()', () => {
    expect(builder.report.results.environment?.osRelease).toBe(OS_RELEASE);
  });

  it('sets results.environment.osVersion from Host.osVersion()', () => {
    expect(builder.report.results.environment?.osVersion).toBe(OS_VERSION);
  });

  it('sets results.environment.extra.machine from Host.machine()', () => {
    expect(builder.report.results.environment?.extra?.['machine']).toBe(MACHINE);
  });

  it('sets results.environment.extra.cpus from Host.cpus()', () => {
    expect(builder.report.results.environment?.extra?.['cpus']).toStrictEqual([]);
  });

  it('sets report.extra.configuration to the anonymized configuration', () => {
    expect(builder.report.extra?.['configuration']).toStrictEqual(NO_CONFIGURATION);
  });

  it('sets results.summary to zero-filled defaults', () => {
    const { tests, passed, failed, skipped, pending, other } = builder.report.results.summary;
    expect({ tests, passed, failed, skipped, pending, other }).toStrictEqual({
      tests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      pending: 0,
      other: 0
    });
  });

  it('sets results.tests to an empty array', () => {
    expect(builder.report.results.tests).toStrictEqual([]);
  });

  it('sets a string reportId and a string timestamp', () => {
    expect(typeof builder.report.reportId).toBe('string');
    expect(typeof builder.report.timestamp).toBe('string');
  });
});
