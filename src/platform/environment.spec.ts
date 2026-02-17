import { it, expect, vi, describe, beforeEach } from 'vitest';
import { logEnvironnement } from './environment.js';
import { logger } from './logger.js';
import { Host } from './Host.js';
import type { CpuInfo } from 'node:os';

vi.setSystemTime(Date.UTC(2026, 0, 29, 0, 9, 0, 0));
vi.mocked(Host.machine).mockReturnValue('virtual');
vi.mocked(Host.cpus).mockReturnValue([]);

beforeEach(() => vi.clearAllMocks());

it('documents the environment', async () => {
  await logEnvironnement();
  expect(logger.info).toHaveBeenCalledWith({
    source: 'job',
    message: expect.stringMatching(
      String.raw`^ui5-test-runner@1.2.3 / Node.js v\d+\.\d+\.\d+ / 2026-01-29T00:09:00\.000Z \(-?\d+\)$`
    ) as string
  });
});

const testCases: { cpuInfos: string[]; expected: string[] }[] = [
  {
    cpuInfos: ['x86'],
    expected: ['virtual / x86']
  },
  {
    cpuInfos: ['x86', 'x86'],
    expected: ['virtual / 2x x86']
  },
  {
    cpuInfos: ['x86', 'x86', 'GPU'],
    expected: ['virtual / 2x x86', 'virtual / GPU']
  },
  {
    cpuInfos: ['x86', 'GPU', 'x86', 'GPU', 'GPU'],
    expected: ['virtual / 2x x86', 'virtual / 3x GPU']
  }
] as const;

describe('documenting the host CPUs', () => {
  for (const testCase of testCases) {
    it(testCase.cpuInfos.join('+'), async () => {
      vi.mocked(Host.cpus).mockReturnValue(
        testCase.cpuInfos.map(
          (model) =>
            ({
              model
            }) as CpuInfo
        )
      );
      await logEnvironnement();
      for (const message of testCase.expected) {
        expect(logger.info).toHaveBeenCalledWith({
          source: 'job',
          message
        });
      }
    });
  }
});
