import { describe, it, expect } from 'vitest';
import { parallelize } from './parallelize.js';
import { setTimeout } from 'node:timers/promises';

const list = [...'abcdefghijklmnopqrstuvwxyz'];

it('handles an empty list', async () => {
  await expect(
    parallelize(
      () => {
        throw new Error('Should not have any item to process');
      },
      [],
      4
    )
  ).resolves.toStrictEqual([]);
});

it('processes all the values', async () => {
  const result = await parallelize(
    (value, index, array) => {
      expect(array).toStrictEqual(list);
      expect(array[index]).toStrictEqual(value);
      return value;
    },
    list,
    1
  );
  expect(result.length).toStrictEqual(list.length);
  expect(result).toStrictEqual(
    list.map((value) => ({
      status: 'fulfilled',
      value
    }))
  );
});

it('supports variable execution times (a > b)', async () => {
  const result = await parallelize(
    async (value) => {
      await setTimeout(value === 'a' ? 250 : 100);
      return value;
    },
    ['a', 'b'],
    2
  );
  expect(result).toStrictEqual([
    {
      status: 'fulfilled',
      value: 'a'
    },
    {
      status: 'fulfilled',
      value: 'b'
    }
  ]);
});

it('supports variable execution times (a < b)', async () => {
  const result = await parallelize(
    async (value) => {
      await setTimeout(value === 'a' ? 100 : 250);
      return value;
    },
    ['a', 'b'],
    2
  );
  expect(result).toStrictEqual([
    {
      status: 'fulfilled',
      value: 'a'
    },
    {
      status: 'fulfilled',
      value: 'b'
    }
  ]);
});

describe('runs as many concurrent tasks as necessary', () => {
  for (let parallel = 2; parallel <= 8; ++parallel) {
    it(`parallel = ${parallel}`, async () => {
      let active = 0;
      let maxActive = 0;
      const result = await parallelize(
        async (value) => {
          ++active;
          maxActive = Math.max(maxActive, active);
          await setTimeout(10);
          --active;
          return value;
        },
        list,
        parallel
      );
      expect(result.length).toStrictEqual(list.length);
      expect(result).toStrictEqual(
        list.map((value) => ({
          status: 'fulfilled',
          value
        }))
      );
      expect(maxActive).toStrictEqual(parallel);
    });
  }
});

describe('supports growing list', () => {
  for (let parallel = 1; parallel <= 8; ++parallel) {
    it(`parallel = ${parallel}`, async () => {
      const partial = list.slice(0, 10);
      const result = await parallelize(
        (value) => {
          if (value === 'e') {
            partial.push(...list.slice(10));
          }
          return value;
        },
        partial,
        1
      );
      expect(result.length).toStrictEqual(list.length);
      expect(result).toStrictEqual(
        list.map((value) => ({
          status: 'fulfilled',
          value
        }))
      );
    });
  }
});

it('augments parallelism (if needed) when the list is growing', async () => {
  const partial = ['a'];
  let active = 0;
  let maxActive = 0;
  const result = await parallelize(
    async (value) => {
      ++active;
      maxActive = Math.max(maxActive, active);
      await setTimeout(10);
      if (value === 'a') {
        partial.push('b', 'c');
      }
      --active;
      return value;
    },
    partial,
    2
  );
  expect(result.length).toStrictEqual(3);
  expect(maxActive).toStrictEqual(2);
  expect(result).toStrictEqual([
    {
      status: 'fulfilled',
      value: 'a'
    },
    {
      status: 'fulfilled',
      value: 'b'
    },
    {
      status: 'fulfilled',
      value: 'c'
    }
  ]);
});

it('does not go beyond the number of items', async () => {
  const result = await parallelize((value) => value, list, 200);
  expect(result.length).toStrictEqual(list.length);
  expect(result).toStrictEqual(
    list.map((value) => ({
      status: 'fulfilled',
      value
    }))
  );
});

it('does not go beyond the number of items (slow start)', async () => {
  const partial = ['a'];
  const result = await parallelize(
    async (value) => {
      if (value === 'a') {
        partial.push(...list.slice(1));
      }
      await setTimeout(10);
      return value;
    },
    partial,
    200
  );
  expect(result.length).toStrictEqual(list.length);
  expect(result).toStrictEqual(
    list.map((value) => ({
      status: 'fulfilled',
      value
    }))
  );
});

it('collects the errors', async () => {
  const reason = new Error('KO');
  const result = await parallelize(
    (value) => {
      if (value === 'f') {
        throw reason;
      }
      return value;
    },
    list,
    4
  );
  expect(result.length).toStrictEqual(list.length);
  expect(result).toStrictEqual(
    list.map((value) =>
      value === 'f'
        ? {
            status: 'rejected',
            reason
          }
        : {
            status: 'fulfilled',
            value
          }
    )
  );
});

it('offers an helper to stop all processing', async () => {
  const reason = new Error('STOP');
  const result = await parallelize(
    function (value) {
      if (value === 'd') {
        this.stop(reason);
      }
      return value;
    },
    list,
    4
  );
  expect(result.length).toStrictEqual(4);
  expect(result).toStrictEqual([
    {
      status: 'fulfilled',
      value: 'a'
    },
    {
      status: 'fulfilled',
      value: 'b'
    },
    {
      status: 'fulfilled',
      value: 'c'
    },
    {
      status: 'rejected',
      reason
    }
  ]);
});

it('offers an helper to know if stopping was requested', async () => {
  const reason = new Error('STOP');
  let stopBefore: boolean | undefined;
  let stopAfter: boolean | undefined;
  await parallelize(
    async function (value) {
      if (value === 'd') {
        stopBefore = this.stopRequested;
        this.stop(reason);
      } else {
        await setTimeout(10); // a, b & c will be triggered after stop
        stopAfter = this.stopRequested;
      }
      return value;
    },
    list,
    4
  );
  expect(stopBefore).toStrictEqual(false);
  expect(stopAfter).toStrictEqual(true);
});
