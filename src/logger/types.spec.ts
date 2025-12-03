import { describe, it, expect, vi } from 'vitest';
import type { InternalLogAttributes } from './types.js';
import { LogLevel, toInternalLogAttributes } from './types.js';
import { Platform } from '../Platform.js';

vi.useFakeTimers();

describe('toInternalLogAttributes', () => {
  it('maps internal attributes', () => {
    expect(
      toInternalLogAttributes(
        {
          source: 'job',
          message: 'test'
        },
        LogLevel.info
      )
    ).toStrictEqual<InternalLogAttributes>({
      timestamp: vi.getMockedSystemTime()?.getTime() ?? -1,
      level: LogLevel.info,
      processId: Platform.pid,
      threadId: Platform.threadId,
      isMainThread: Platform.isMainThread,
      source: 'job',
      message: 'test'
    });
  });
});
