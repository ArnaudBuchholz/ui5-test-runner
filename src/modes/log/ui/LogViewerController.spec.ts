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
const FIVE_MINUTES = 300_000 as const;
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
  const connect = controller.connect(update);
  return { controller, update, connect, promise };
};

beforeEach(() => vi.clearAllMocks());

it('initializes the UI state', () => {
  const { connect } = setup();
  expect(connect).toStrictEqual({
    initialState: {
      timerangeType: 'relative',
      relativeTimerange: 5 * ONE_MINUTE,
      absoluteTimerangeFrom: 0,
      absoluteTimerangeTo: 0,
      autorefresh: 'off',
      filter: '',
      logs: [],
      metrics: getInitialLogMetrics()
    },
    settings: {
      relativeTimerange: expect.any(Array) as object,
      autorefresh: expect.any(Array) as object
    }
  });
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
    expect(update).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith({
      absoluteTimerangeFrom: NOW - ONE_MINUTE,
      absoluteTimerangeTo: NOW,
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
    expect(update).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith({
      timerangeType: 'absolute',
      absoluteTimerangeFrom: NOW - TEN_MINUTES,
      absoluteTimerangeTo: NOW,
      logs,
      metrics
    } satisfies Partial<State>);
  });
});

describe('query parameters', () => {
  const scenarios: { label: string; interactions: UIEvent<State, Actions>[]; query: LogStorageQuery }[] = [
    {
      label: 'absolute timerange',
      interactions: [
        {
          timerangeType: 'absolute',
          absoluteTimerangeFrom: NOW - FOUR_MINUTES,
          absoluteTimerangeTo: NOW,
          action: 'refresh_now'
        }
      ],
      query: {
        from: NOW - FOUR_MINUTES,
        to: NOW
      }
    },
    {
      label: 'relative timerange',
      interactions: [
        {
          timerangeType: 'relative',
          relativeTimerange: FIVE_MINUTES,
          action: 'refresh_now'
        }
      ],
      query: {
        from: NOW - FIVE_MINUTES
      }
    },
    {
      label: 'filter',
      interactions: [
        {
          timerangeType: 'relative',
          relativeTimerange: FIVE_MINUTES,
          filter: 'source === "job"',
          action: 'refresh_now'
        }
      ],
      query: {
        from: NOW - FIVE_MINUTES,
        filter: 'source === "job"'
      }
    }
  ] as const;

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
