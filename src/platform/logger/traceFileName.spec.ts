import { it, expect } from 'vitest';
import { traceFileName } from './traceFileName.js';

it('derives a trace file name from the run start time (UTC, compact)', () => {
  const startedAt = new Date('2025-10-30T21:56:00.000Z').getTime();
  expect(traceFileName(startedAt)).toStrictEqual('traces-20251030-215600.logz');
});

it('is stable for the same start time (shared by writer and reader)', () => {
  const startedAt = Date.now();
  expect(traceFileName(startedAt)).toStrictEqual(traceFileName(startedAt));
});
