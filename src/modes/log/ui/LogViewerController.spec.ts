import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LogViewerController } from './LogViewerController.js';
import type { Actions, State } from './LogViewerController.js';
import type { LogMetrics } from '../LogMetrics.js';
import { getInitialLogMetrics } from '../LogMetrics.js';
import type { InternalLogAttributes } from '../../../platform/logger/types.js';
import type { LogStorageQuery } from '../ILogStorage.js';
import type { UIEvent } from '../../../types/UserInterfaceController.js';

const NOW = Date.now();
vi.setSystemTime(NOW);

const ONE_MINUTE = 60 * 1000;
const FOUR_MINUTES = 4 * ONE_MINUTE;
const TEN_MINUTES = 10 * ONE_MINUTE;

// Bypass protected method visibility issue
type SpiedLogViewerController = {
  _executeQuery: (query: LogStorageQuery) => Promise<{ metrics: LogMetrics; logs: InternalLogAttributes[] }>;
};

const executeQuery = vi.spyOn(LogViewerController.prototype as unknown as SpiedLogViewerController, '_executeQuery');

executeQuery.mockResolvedValue({
  metrics: getInitialLogMetrics(),
  logs: []
});

// Based on the assumption that updates are immediate consequences of interaction
const setup = () => {
  const controller = LogViewerController.create();
  const { promise, resolve } = Promise.withResolvers<void>();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const update = vi.fn().mockImplementation(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => resolve(), 10);
  });
  controller.connect(update);
  return { controller, update, promise };
};

beforeEach(() => vi.clearAllMocks());

it('initializes the UI state', async () => {
  const { update, promise } = setup();
  await promise;
  expect(update).toHaveBeenNthCalledWith(1, {
    timerange: {
      type: 'relative',
      value: '5m'
    },
    autorefresh: 'off',
    filter: '',
    logs: [],
    metrics: getInitialLogMetrics()
  } satisfies State);
});

describe('first query', () => {
  it('triggers an initial request', async () => {
    const { promise } = setup();
    await promise;
    expect(executeQuery).toHaveBeenCalledWith({});
  });

  it('does not change initial setup if still reading and traces are not too old', async () => {
    const metrics = {
      ...getInitialLogMetrics(),
      inputSize: 5,
      chunksCount: 1,
      outputSize: 25,
      minTimestamp: NOW - ONE_MINUTE,
      maxTimestamp: NOW - ONE_MINUTE,
      logCount: 1,
      reading: true
    };
    const logs = [
      {
        timestamp: NOW - ONE_MINUTE,
        source: 'job',
        message: 'Hello World !'
      }
    ] as InternalLogAttributes[];
    executeQuery.mockResolvedValueOnce({ metrics, logs });
    const { update, promise } = setup();
    await promise;
    expect(update).toHaveBeenNthCalledWith(2, {
      logs,
      metrics
    } satisfies Partial<State>);
  });

  it('switches to absolute timerange if the first trace is older than 5 minute', async () => {
    const metrics = {
      ...getInitialLogMetrics(),
      inputSize: 5,
      chunksCount: 1,
      outputSize: 25,
      minTimestamp: NOW - TEN_MINUTES,
      maxTimestamp: NOW - TEN_MINUTES,
      logCount: 1,
      reading: true
    };
    const logs = [
      {
        timestamp: NOW - TEN_MINUTES,
        source: 'job',
        message: 'Hello World !'
      }
    ] as InternalLogAttributes[];
    executeQuery.mockResolvedValueOnce({ metrics, logs });
    const { update, promise } = setup();
    await promise;
    expect(update).toHaveBeenNthCalledWith(2, {
      timerange: {
        type: 'absolute',
        from: NOW - TEN_MINUTES,
        to: NOW
      },
      logs,
      metrics
    } satisfies Partial<State>);
  });
});

describe('query parameters', () => {
  const scenarios: { label: string, interactions: UIEvent<State, Actions>[], query: LogStorageQuery }[] = [{
    label: 'absolute timerange',
    interactions: [{
      type: 'change',
      field: 'timerange.type',
      value: 'absolute'
    }, {
      type: 'change',
      field: 'timerange.from',
      value: NOW - FOUR_MINUTES
    }, {
      type: 'change',
      field: 'timerange.to',
      value: NOW
    }, {
      type: 'action',
      action: 'refresh_now'
    }],
    query: {
      from: NOW - FOUR_MINUTES,
      to: NOW
    },
  }] as const;

  for (const scenario of scenarios) {
    it(scenario.label, async () => {
      const { controller, promise } = setup();
      for (const interaction of scenario.interactions) {
        controller.interaction(interaction);
      }
      await promise;
      expect(executeQuery).toHaveBeenCalledWith(scenario.query);
    });
  }
});
