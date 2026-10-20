import { afterEach, describe, expect, it, vi } from 'vitest';
import { FileSystem, logger } from '../../platform/index.js';
import type { IBatchItem } from './BatchItem.js';
import { printBatchOutput } from './output.js';

const item = (id: string): IBatchItem => ({
  path: `/path/${id}`,
  id,
  label: `Label ${id}`,
  args: [],
  reportDir: `/report/${id}`
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('printBatchOutput()', () => {
  it('prints available output in alphabetical batch-id order', async () => {
    vi.spyOn(FileSystem, 'readFile').mockResolvedValueOnce('alpha output').mockResolvedValueOnce('zebra output');
    const info = vi.spyOn(logger, 'info').mockImplementation(() => {});

    await printBatchOutput([item('zebra'), item('alpha')]);

    expect(info).toHaveBeenNthCalledWith(1, {
      source: 'job',
      message: 'Batch output: Label alpha (alpha)\nalpha output'
    });
    expect(info).toHaveBeenNthCalledWith(2, {
      source: 'job',
      message: 'Batch output: Label zebra (zebra)\nzebra output'
    });
  });

  it('warns when a child output file is missing', async () => {
    vi.spyOn(FileSystem, 'readFile').mockRejectedValue(new Error('ENOENT'));
    const info = vi.spyOn(logger, 'info').mockImplementation(() => {});
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});

    await printBatchOutput([item('missing')]);

    expect(info).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith({
      source: 'job',
      message: 'No batch output: Label missing (missing)'
    });
  });
});
