import { describe, it, expect, vi } from 'vitest';
import { LogViewerController } from './LogViewerController.js';
import type { State } from './LogViewerController.js';
import { getInitialLogMetrics, LogMetrics } from '../LogMetrics.js';
import { InternalLogAttributes } from '../../../platform/logger/types.js';
import { LogStorageQuery } from '../ILogStorage.js';

// Bypass protected method visibility issue
type SpiedLogViewerController = {
  _executeQuery: (query: LogStorageQuery) => Promise<{ metrics: LogMetrics, logs: InternalLogAttributes[]}>;
};

const executeQuery = vi.spyOn(LogViewerController.prototype as unknown as SpiedLogViewerController, '_executeQuery');

executeQuery.mockResolvedValue({
  metrics: getInitialLogMetrics(),
  logs: []
});

it('initialize the UI state', () => {
  const controller = LogViewerController.create();
  const handler = vi.fn();
  controller.connect(handler);
  expect(handler).toHaveBeenCalledWith({
    timerange: {
      type: 'relative',
      value: '5m'
    },
    autorefresh: 'off',
    filter: '',
    logs: [],
    metrics: getInitialLogMetrics(),
    status: 'reading'
  } satisfies State);
});

describe('default after doing the first query', () => {
  it('sets to relative if still reading', async () => {
    const controller = new LogViewerController();
    const { promise, resolve } = Promise.withResolvers<void>();
    const handler = vi.fn(() => resolve());
    const metrics = {
      ...getInitialLogMetrics(),
      inputSize: 5,
      chunksCount: 1,
      outputSize: 25,
      minTimestamp: 1000,
      maxTimestamp: 1000,
      logCount: 1,
      reading: true,
    };
    const logs = [{
      timestamp: 1000,
      source: 'job',
      message: 'Hello World !'
    }] as InternalLogAttributes[];
    executeQuery.mockResolvedValueOnce({ metrics, logs });
    controller.connect(handler);
    await promise;
  })
});
