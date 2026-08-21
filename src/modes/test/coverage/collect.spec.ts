import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileSystem, Path, logger } from '../../../platform/index.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import type { PageContext } from '../PageContext.js';
import { collect } from './collect.js';

beforeEach(() => vi.clearAllMocks());

const COVERAGE_TEMP_DIR = '/tmp/coverage';
const COVERAGE_SOURCE_DIR = '/src/webapp';

const COVERAGE_DATA = { '/src/file.js': { path: '/src/file.js', s: {} } };

const BASE_CONFIGURATION = {
  coverage: true,
  coverageTempDir: COVERAGE_TEMP_DIR
} as unknown as Configuration;

const SOURCE_DIR_CONFIGURATION = {
  coverage: true,
  coverageTempDir: COVERAGE_TEMP_DIR,
  coverageSourceDir: COVERAGE_SOURCE_DIR
} as unknown as Configuration;

const makePageContext = (overrides: Partial<PageContext> = {}): PageContext =>
  ({
    pageId: 'page1',
    url: 'http://localhost/test.html',
    isSuite: false,
    page: { eval: vi.fn().mockResolvedValue(COVERAGE_DATA) },
    ...overrides
  }) as unknown as PageContext;

it('does nothing when coverage is disabled', async () => {
  const configuration = { coverage: false, coverageTempDir: COVERAGE_TEMP_DIR } as unknown as Configuration;
  const pageContext = makePageContext();
  await collect(configuration, pageContext);
  expect(FileSystem.writeFile).not.toHaveBeenCalled();
});

it('does nothing when pageContext is a suite', async () => {
  const pageContext = makePageContext({ isSuite: true });
  await collect(BASE_CONFIGURATION, pageContext);
  expect(FileSystem.writeFile).not.toHaveBeenCalled();
});

it('writes coverage data as JSON to coverageTempDir/<pageId>.json', async () => {
  const pageContext = makePageContext();
  await collect(BASE_CONFIGURATION, pageContext);
  expect(FileSystem.writeFile).toHaveBeenCalledWith(
    Path.join(COVERAGE_TEMP_DIR, 'page1.json'),
    JSON.stringify(COVERAGE_DATA)
  );
});

it('logs debug with source, pageId, url and filePath', async () => {
  const pageContext = makePageContext();
  await collect(BASE_CONFIGURATION, pageContext);
  expect(logger.debug).toHaveBeenCalledWith(
    expect.objectContaining({
      source: 'coverage',
      pageId: 'page1',
      message: 'Coverage collected for http://localhost/test.html'
    })
  );
});

it('does not write and logs a warning when page has no coverage data', async () => {
  const pageContext = makePageContext({ page: { eval: vi.fn().mockResolvedValue(null) } as never });
  await collect(BASE_CONFIGURATION, pageContext);
  expect(FileSystem.writeFile).not.toHaveBeenCalled();
  expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ source: 'coverage', pageId: 'page1' }));
});

it('throws when coverage data is not an object', async () => {
  const pageContext = makePageContext({ page: { eval: vi.fn().mockResolvedValue('raw-string') } as never });
  await expect(collect(BASE_CONFIGURATION, pageContext)).rejects.toThrow();
});

it('throws when coverage data is an empty object', async () => {
  const pageContext = makePageContext({ page: { eval: vi.fn().mockResolvedValue({}) } as never });
  await expect(collect(BASE_CONFIGURATION, pageContext)).rejects.toThrow();
});

it('throws when coverage data entries lack a path property', async () => {
  const pageContext = makePageContext({ page: { eval: vi.fn().mockResolvedValue({ key: { s: {} } }) } as never });
  await expect(collect(BASE_CONFIGURATION, pageContext)).rejects.toThrow();
});

describe('when coverageSourceDir is set', () => {
  it('remaps entry keys and path fields to absolute paths under coverageSourceDir', async () => {
    const relativeKey = 'src/file.js';
    const data = { [relativeKey]: { path: relativeKey, s: { 0: 1 } } };
    const pageContext = makePageContext({ page: { eval: vi.fn().mockResolvedValue(data) } as never });
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    await collect(SOURCE_DIR_CONFIGURATION, pageContext);
    const absoluteKey = `${COVERAGE_SOURCE_DIR}/${relativeKey}`;
    const written = JSON.parse(vi.mocked(FileSystem.writeFile).mock.calls[0]![1] as string) as Record<
      string,
      { path: string }
    >;
    expect(written[absoluteKey]).toBeDefined();
    expect(written[absoluteKey]!.path).toBe(absoluteKey);
  });
});
