import { assert } from './assert.js';

export const parallelize = async <INPUT, OUTPUT = INPUT>(
  processor: (input: INPUT, index: number, values: INPUT[]) => Promise<OUTPUT> | OUTPUT,
  queue: INPUT[],
  parallel: number
): Promise<Array<PromiseSettledResult<OUTPUT>>> => {
  const results: Array<PromiseSettledResult<OUTPUT>> = [];
  let index = 0;
  const fiber = async (): Promise<void> => {
    while (index < queue.length) {
      const current = index++;
      try {
        const input = queue[current];
        assert(input !== undefined);
        results[current] = {
          status: 'fulfilled',
          value: await processor(input, current, queue)
        };
      } catch (error) {
        results[current] = {
          status: 'rejected',
          reason: error
        };
      }
    }
  };
  await Promise.all(Array.from({ length: parallel }).fill(0).map(fiber));
  return results;
};
