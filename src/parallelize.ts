import { assert } from './assert.js';

interface IParallelizeContext {
  stop(reason: Error): void;
}

export const parallelize = async <INPUT, OUTPUT = INPUT>(
  processor: (this: IParallelizeContext, input: INPUT, index: number, values: INPUT[]) => Promise<OUTPUT> | OUTPUT,
  queue: INPUT[],
  parallel: number
): Promise<Array<PromiseSettledResult<OUTPUT>>> => {
  const results: Array<PromiseSettledResult<OUTPUT>> = [];
  let index = 0;
  let stopped = false;
  const context = {
    stop(reason: Error) {
      stopped = true;
      throw reason;
    }
  };
  const fiber = async (): Promise<void> => {
    while (!stopped && index < queue.length) {
      const current = index++;
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
  };
  await Promise.all(Array.from({ length: parallel }, fiber));
  return results;
};
