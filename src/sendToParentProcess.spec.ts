import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Host, Process } from './platform/index.js';
import { sendToParentProcess } from './sendToParentProcess.js';

const TEST_MESSAGE = { type: 'test', data: 'hello' };

describe('sendToParentProcess', () => {
  const originalEnvironment = { ...Host.env };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.assign(Host.env, originalEnvironment);
    delete (Host.env as Record<string, string | undefined>)['UI5TR_BATCH_MODE'];
  });

  it('does not send message when UI5TR_BATCH_MODE is disabled', () => {
    sendToParentProcess(TEST_MESSAGE);

    expect(Process.sendToParent).not.toHaveBeenCalled();
  });

  it('sends message to parent process when UI5TR_BATCH_MODE is enabled', () => {
    Object.assign(Host.env, {
      UI5TR_BATCH_MODE: '1'
    });

    sendToParentProcess(TEST_MESSAGE);

    expect(Process.sendToParent).toHaveBeenCalledWith(TEST_MESSAGE);
  });
});
