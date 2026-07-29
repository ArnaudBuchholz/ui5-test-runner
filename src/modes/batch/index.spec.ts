import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger, Exit } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { batch } from './index.js';

vi.mock('../../platform/mock.js');
vi.mock('./resolve.js');
vi.mock('./batchTask.js');
vi.mock('./report.js');
vi.mock('../../start.js');
vi.mock('../../reports/saveReport.js');

import { resolve } from './resolve.js';
import { batchTask } from './batchTask.js';
import { buildBatchReport } from './report.js';
import { start } from '../../start.js';
import { saveReport } from '../../reports/saveReport.js';
import type { IBatchItem } from './BatchItem.js';
import type { IProcess } from '../../platform/index.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';

const makeConfig = (): Configuration =>
  ({ cwd: '/cwd', reportDir: '/report', parallel: 2, sources: {} }) as unknown as Configuration;

const makeItem = (id: string): IBatchItem => ({
  path: `/path/${id}`,
  id,
  label: id,
  args: ['--cwd', `/path/${id}`],
  statusCode: 0
});

const makeProcess = (): IProcess => ({
  pid: 1,
  stdout: '',
  stderr: '',
  closed: Promise.resolve(),
  code: 0,
  kill: vi.fn().mockResolvedValue(undefined)
});

const STUB_REPORT = { reportFormat: 'CTRF' } as unknown as CommonTestReport;
const DEFAULT_EXIT_CODE = 0;

beforeEach(() => {
  vi.clearAllMocks();
  Exit.code = DEFAULT_EXIT_CODE;
  vi.mocked(start).mockResolvedValue(undefined);
  vi.mocked(buildBatchReport).mockResolvedValue(STUB_REPORT);
  vi.mocked(saveReport).mockResolvedValue(undefined);
});

describe('batch()', () => {
  describe('when no items are resolved', () => {
    it('logs a warning and returns without running tasks', async () => {
      vi.mocked(resolve).mockResolvedValue([]);
      await batch(makeConfig());
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('No batch items') as unknown })
      );
      expect(batchTask).not.toHaveBeenCalled();
    });

    it('does not generate a report when no items are found', async () => {
      vi.mocked(resolve).mockResolvedValue([]);
      await batch(makeConfig());
      expect(buildBatchReport).not.toHaveBeenCalled();
      expect(saveReport).not.toHaveBeenCalled();
    });
  });

  describe('when items are resolved', () => {
    it('calls task() for each batch item', async () => {
      vi.mocked(resolve).mockResolvedValue([makeItem('a'), makeItem('b')]);
      await batch(makeConfig());
      expect(batchTask).toHaveBeenCalledTimes(2);
    });

    it('does not set Exit.code when all items succeed', async () => {
      vi.mocked(resolve).mockResolvedValue([makeItem('a')]);
      await batch(makeConfig());
      expect(Exit.code).toBe(DEFAULT_EXIT_CODE);
    });

    it('sets Exit.code to -1 when an item has a non-zero statusCode', async () => {
      const item = makeItem('a');
      vi.mocked(resolve).mockResolvedValue([item]);
      vi.mocked(batchTask).mockImplementation((_, batchItem) => {
        batchItem.statusCode = 1;
        return Promise.resolve(batchItem);
      });
      await batch(makeConfig());
      expect(Exit.code).toBe(-1);
    });

    it('kills the start process after tasks complete', async () => {
      const startProcess = makeProcess();
      vi.mocked(start).mockResolvedValue(startProcess);
      vi.mocked(resolve).mockResolvedValue([makeItem('a')]);
      await batch(makeConfig());
      expect(startProcess.kill).toHaveBeenCalled();
    });

    it('kills the start process even when tasks throw', async () => {
      const startProcess = makeProcess();
      vi.mocked(start).mockResolvedValue(startProcess);
      vi.mocked(resolve).mockResolvedValue([makeItem('a')]);
      vi.mocked(batchTask).mockRejectedValue(new Error('task failed'));
      await batch(makeConfig());
      expect(startProcess.kill).toHaveBeenCalled();
    });

    it('builds the report with items and configuration', async () => {
      const items = [makeItem('a')];
      vi.mocked(resolve).mockResolvedValue(items);
      await batch(makeConfig());
      expect(buildBatchReport).toHaveBeenCalledWith(items, makeConfig());
    });

    it('saves the report after tasks complete', async () => {
      vi.mocked(resolve).mockResolvedValue([makeItem('a')]);
      await batch(makeConfig());
      expect(saveReport).toHaveBeenCalledWith(makeConfig(), STUB_REPORT);
    });
  });
});
