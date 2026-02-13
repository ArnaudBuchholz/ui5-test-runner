import { assert } from '../platform/assert.js';

export interface IParallelizeContext {
  stop(reason: Error): void;
  readonly stopRequested: boolean;
}

export const parallelize = async <INPUT, OUTPUT = INPUT>(
  processor: (this: IParallelizeContext, input: INPUT, index: number, values: INPUT[]) => Promise<OUTPUT> | OUTPUT,
  queue: INPUT[],
  parallel: number
): Promise<Array<PromiseSettledResult<OUTPUT>>> => {
  const results: Array<PromiseSettledResult<OUTPUT>> = [];
  let index = 0;
  const context = {
    stop(reason: Error) {
      context.stopRequested = true;
      throw reason;
    },
    stopRequested: false
  };
  let active = 0;
  const { promise, resolve } = Promise.withResolvers<Array<PromiseSettledResult<OUTPUT>>>();
  const fiber = async (): Promise<void> => {
    ++active;
    while (!context.stopRequested && index < queue.length) {
      const current = index++;
      if (active < parallel && index < queue.length) {
        void fiber();
      }
      try {
        const input = queue[current];
        assert(input !== undefined);
        results[current] = {
          status: 'fulfilled',
          value: await processor.call(context, input, current, queue)
        };
      } catch (error) {
        results[current] = {
          status: 'rejected',
          reason: error
        };
      }
    }
    if (--active === 0) {
      resolve(results);
    }
  };
  void fiber();
  return promise;
};
