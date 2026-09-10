import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Exit, Host } from './platform/index.js';
import type { Configuration } from './configuration/Configuration.js';

vi.mock('./configuration/CommandLine.js', () => ({
  CommandLine: {
    buildConfigurationFrom: vi.fn()
  }
}));

vi.mock('./modes/execute.js', () => ({
  execute: vi.fn()
}));

vi.mock('./if.js', () => ({
  isIfEvaluatedAsTrue: vi.fn()
}));

vi.mock('./sendToParentProcess.js', () => ({
  sendToParentProcess: vi.fn()
}));

import { CommandLine } from './configuration/CommandLine.js';
import { execute } from './modes/execute.js';
import { isIfEvaluatedAsTrue } from './if.js';
import { sendToParentProcess } from './sendToParentProcess.js';

const MOCK_ARGV = ['/usr/bin/node', '/usr/bin/cli.js', '--help'];
const MOCK_CONFIGURATION = { mode: 'help' } as unknown as Configuration;
const DEFAULT_EXIT_CODE = 999;

const runCli = async () => {
  vi.resetModules();
  await import('./cli.js');
};

beforeEach(() => {
  vi.clearAllMocks();
  Exit.code = DEFAULT_EXIT_CODE;
  Object.assign(Host, { argv: MOCK_ARGV });
  vi.mocked(Host.cwd).mockReturnValue('/test/cwd');
  vi.mocked(CommandLine.buildConfigurationFrom).mockResolvedValue(MOCK_CONFIGURATION);
  vi.mocked(isIfEvaluatedAsTrue).mockResolvedValue(true);
  vi.mocked(execute).mockResolvedValue(undefined);
});

describe('cli', () => {
  describe('when --if condition is true', () => {
    it('builds configuration from cwd and sliced argv', async () => {
      await runCli();
      expect(CommandLine.buildConfigurationFrom).toHaveBeenCalledWith('/test/cwd', ['--help']);
    });

    it('evaluates the --if condition', async () => {
      await runCli();
      expect(isIfEvaluatedAsTrue).toHaveBeenCalledWith(MOCK_CONFIGURATION);
    });

    it('executes the configuration', async () => {
      await runCli();
      expect(execute).toHaveBeenCalledWith(MOCK_CONFIGURATION);
    });

    it('does not log the skip message', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      await runCli();
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('SKIPIF'));
    });

    it('does not send a skip message to parent process', async () => {
      await runCli();
      expect(sendToParentProcess).not.toHaveBeenCalled();
    });
  });

  describe('when --if condition is false', () => {
    beforeEach(() => {
      vi.mocked(isIfEvaluatedAsTrue).mockResolvedValue(false);
    });

    it('does not execute the configuration', async () => {
      await runCli();
      expect(execute).not.toHaveBeenCalled();
    });

    it('logs the skip message', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      await runCli();
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ [SKIPIF] Skipping execution (--if)');
    });

    it('sends a skip message to parent process', async () => {
      await runCli();
      expect(sendToParentProcess).toHaveBeenCalledWith({ type: 'skip' });
    });
  });

  describe('when CommandLine.buildConfigurationFrom throws', () => {
    it('logs the error and sets Exit.code to -1', async () => {
      const error = new Error('invalid option');
      vi.mocked(CommandLine.buildConfigurationFrom).mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error');
      await runCli();
      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(Exit.code).toBe(-1);
    });

    it('does not execute the configuration', async () => {
      vi.mocked(CommandLine.buildConfigurationFrom).mockRejectedValue(new Error('invalid option'));
      await runCli();
      expect(execute).not.toHaveBeenCalled();
    });
  });

  describe('when execute throws', () => {
    it('logs the error and sets Exit.code to -1', async () => {
      const error = new Error('execution failed');
      vi.mocked(execute).mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error');
      await runCli();
      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(Exit.code).toBe(-1);
    });
  });

  describe('argv slicing', () => {
    it('slices argv after the cli entry when matched by path', async () => {
      Object.assign(Host, { argv: ['/usr/bin/node', '/path/to/cli.ts', '--version'] });
      await runCli();
      expect(CommandLine.buildConfigurationFrom).toHaveBeenCalledWith('/test/cwd', ['--version']);
    });

    it('slices argv after the cli entry when matched by name', async () => {
      Object.assign(Host, { argv: ['/usr/bin/node', '/path/to/ui5-test-runner', '--url', 'http://localhost'] });
      await runCli();
      expect(CommandLine.buildConfigurationFrom).toHaveBeenCalledWith('/test/cwd', ['--url', 'http://localhost']);
    });

    it('passes the full argv when cli entry is not found', async () => {
      Object.assign(Host, { argv: ['/usr/bin/node'] });
      await runCli();
      expect(CommandLine.buildConfigurationFrom).toHaveBeenCalledWith('/test/cwd', ['/usr/bin/node']);
    });
  });

  describe('Exit.shutdown', () => {
    it('calls Exit.shutdown in the finally block on success', async () => {
      await runCli();
      expect(Exit.shutdown).toHaveBeenCalled();
    });

    it('calls Exit.shutdown in the finally block on error', async () => {
      vi.mocked(CommandLine.buildConfigurationFrom).mockRejectedValue(new Error('fail'));
      await runCli();
      expect(Exit.shutdown).toHaveBeenCalled();
    });
  });
});
