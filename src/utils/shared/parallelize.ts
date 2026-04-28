export interface IParallelizeContext {
  stop(reason: Error): void;
  readonly stopRequested: boolean;
}

export type ParallelizeEvent<INPUT, OUTPUT> =
  | {
      type: 'started';
      index: number;
      input: INPUT;
    }
  | {
      type: 'completed';
      index: number;
      input: INPUT;
      output: OUTPUT;
    }
  | {
      type: 'failed';
      index: number;
      input: INPUT;
      error: unknown;
    };

type ParallelizeOptions<INPUT, OUTPUT> = {
  parallel?: number;
  on?: (event: ParallelizeEvent<INPUT, OUTPUT>) => void;
};

export const parallelize = async <INPUT, OUTPUT = INPUT>(
  processor: (this: IParallelizeContext, input: INPUT, index: number, values: INPUT[]) => Promise<OUTPUT> | OUTPUT,
  queue: INPUT[],
  options?: ParallelizeOptions<INPUT, OUTPUT>
): Promise<Array<PromiseSettledResult<OUTPUT>>> => {
  const { parallel = 1, on } = options ?? {};
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
      const input = queue[current]!;
      try {
        on?.({
          type: 'started',
          index: current,
          input
        });
        const output = await processor.call(context, input, current, queue);
        results[current] = {
          status: 'fulfilled',
          value: output
        };
        on?.({
          type: 'completed',
          index: current,
          input,
          output
        });
      } catch (error) {
        on?.({
          type: 'failed',
          index: current,
          input,
          error
        });
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
