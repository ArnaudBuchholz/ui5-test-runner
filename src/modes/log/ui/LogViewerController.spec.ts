import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LogViewerController } from './LogViewerController.js';
import type { Actions, State } from './types.js';
import { getInitialLogMetrics } from '../LogMetrics.js';
import type { InternalLogAttributes } from '../../../platform/logger/types.js';
import type { UIEvent } from '../../../types/IUserInterfaceController.js';

const NOW = Date.now();
vi.setSystemTime(NOW);

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const FIVE_MINUTES = 300_000;
const FOUR_MINUTES = 4 * ONE_MINUTE;
const TEN_MINUTES = 10 * ONE_MINUTE;

const fetchSpy = vi.spyOn(globalThis, 'fetch');
fetchSpy.mockResolvedValue({
  ok: true,
  json: () =>
    Promise.resolve({
      metrics: getInitialLogMetrics(),
      logs: []
    })
} as Response);

const setIntervalSpy = vi
  .spyOn(globalThis, 'setInterval')
  .mockImplementation(() => ({}) as ReturnType<typeof setIntervalSpy>);
const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval').mockImplementation(() => {});

beforeEach(() => vi.clearAllMocks());

// Based on the assumption that updates are immediate consequences of interaction
const setup = () => {
  const controller = new LogViewerController();
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

it('initializes the UI state', () => {
  const { connect } = setup();
  expect(connect).toStrictEqual({
    initialState: {
      timerangeType: 'relative',
      relativeTimerange: 5 * ONE_MINUTE,
      absoluteTimerangeFrom: 0,
      absoluteTimerangeTo: 0,
      autorefresh: false,
      autorefreshInterval: 5 * ONE_SECOND,
      filter: '',
      errorMessage: '',
      logs: [],
      metrics: getInitialLogMetrics()
    },
    settings: {
      relativeTimerange: expect.any(Array) as object,
      autorefresh: expect.any(Array) as object
    }
  });
});

describe('query', () => {
  describe('error handling', () => {
    describe('initial request', () => {
      it('updates the UI with the error message on failure (no message in body)', async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('')
        } as Response);
        const { promise, update } = setup();
        await promise;
        expect(update).toHaveBeenCalledWith({
          errorMessage: '500 Internal Server Error'
        } satisfies Partial<State>);
      });

      it('updates the UI with the error message on failure (message in body)', async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('An error occurred')
        } as Response);
        const { promise, update } = setup();
        await promise;
        expect(update).toHaveBeenCalledWith({
          errorMessage: 'An error occurred'
        } satisfies Partial<State>);
      });
    });

    describe('on refresh_now', () => {
      it('updates the UI with the error message on failure', async () => {
        const { controller, promise, update } = setup();
        await promise; // wait for initial request
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('An error occurred')
        } as Response);
        const { promise: updateCalled, resolve } = Promise.withResolvers<void>();
        vi.mocked(update).mockImplementation(() => resolve());
        controller.interaction({ action: 'refresh_now' });
        await updateCalled;
        expect(update).toHaveBeenCalledWith({
          errorMessage: 'An error occurred'
        } satisfies Partial<State>);
      });
    });
  });

  describe('first query', () => {
    it('triggers an initial request', async () => {
      const { promise } = setup();
      await promise;
      expect(fetchSpy).toHaveBeenCalledWith('/query?');
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
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ metrics, logs })
      } as Response);
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
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ metrics, logs })
      } as Response);
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
    const scenarios: { label: string; interactions: UIEvent<State, Actions>[]; query: string }[] = [
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
        query: `from=${NOW - FOUR_MINUTES}&to=${NOW}`
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
        query: `from=${NOW - FIVE_MINUTES}`
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
        query: `from=${NOW - FIVE_MINUTES}&filter=source+%3D%3D%3D+%22job%22`
      }
    ] as const;

    for (const scenario of scenarios) {
      it(scenario.label, async () => {
        const { controller, promise } = setup();
        for (const interaction of scenario.interactions) {
          controller.interaction(interaction);
        }
        await promise;
        expect(fetchSpy).toHaveBeenCalledWith('/query?' + scenario.query);
      });
    }
  });

  describe('autorefresh', () => {
    it('starts when autorefresh = true', async () => {
      const { controller, promise } = setup();
      controller.interaction({ autorefresh: true });
      await promise;
      expect(setIntervalSpy).toHaveBeenCalledOnce();
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function) as () => void, 5000);
    });

    it('triggers refresh_now', async () => {
      const { controller, promise } = setup();
      controller.interaction({ autorefresh: true });
      await promise;
      const [callback] = setIntervalSpy.mock.calls[0]!; // Call validated before
      vi.clearAllMocks();
      callback();
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringMatching(/^\/query\?/));
    });

    it('stops when autorefresh = false', async () => {
      const { controller, promise } = setup();
      controller.interaction({ autorefresh: true });
      controller.interaction({ autorefresh: false });
      await promise;
      expect(clearIntervalSpy).toHaveBeenCalledOnce();
    });

    it('restarts when autorefreshInterval changes', async () => {
      const { controller, promise } = setup();
      controller.interaction({ autorefresh: true });
      controller.interaction({ autorefreshInterval: 10_000 });
      await promise;
      expect(setIntervalSpy).toHaveBeenCalledTimes(2);
      expect(clearIntervalSpy).toHaveBeenCalledOnce();
    });
  });
});
