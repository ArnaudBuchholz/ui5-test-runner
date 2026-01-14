import { describe, it, expect, vi } from 'vitest';
import { Host, Thread } from '../system/index.js';
import type { InternalLogAttributes } from './types.js';
import { LogLevel, toInternalLogAttributes } from './types.js';

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
      processId: Host.pid,
      threadId: Thread.threadId,
      isMainThread: Thread.isMainThread,
      source: 'job',
      message: 'test'
    });
  });
});
