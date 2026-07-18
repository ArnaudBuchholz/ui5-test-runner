import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Host, Process } from './platform/index.js';
import { sendToParentProcess } from './sendToParentProcess.js';

const TEST_MESSAGE = { type: 'test', data: 'hello' };

describe('sendToParentProcess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not send message when UI5TR_BATCH_MODE is disabled', () => {
    sendToParentProcess(TEST_MESSAGE);

    expect(Process.sendToParent).not.toHaveBeenCalled();
  });

  it('should send message to parent process when UI5TR_BATCH_MODE is enabled', () => {
    Object.assign(Host.env, {
      UI5TR_BATCH_MODE: '1'
    });

    sendToParentProcess(TEST_MESSAGE);

    expect(Process.sendToParent).toHaveBeenCalledWith(TEST_MESSAGE);
  });
});
