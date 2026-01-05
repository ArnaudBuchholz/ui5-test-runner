import type { ChildProcess, SpawnOptions } from 'node:child_process';
import { spawn } from 'node:child_process';
import { logger } from './logger.js';

export interface IProcess {
  readonly stdout: string;
  readonly stderr: string;
  readonly code: number | undefined;
  readonly closed: Promise<void>;
}

/** This class simplifies mocking during tests */
export class Process implements IProcess {
  static readonly spawn: (command: string, arguments_: string[], options?: SpawnOptions) => IProcess = (
    command,
    arguments_,
    options = {}
  ) => {
    if (command === 'node') {
      command = process.argv[0] as string;
    }
    try {
      const childProcess = spawn(command, arguments_, options);
      logger.debug({ source: 'process', processId: childProcess.pid, message: 'spawn', data: { command, arguments: arguments_, options }});
      return new Process(childProcess);
    } catch (error) {
      logger.error({ source: 'process', message: 'spawn failed', data: { command, arguments: arguments_, options }, error });
      throw error;
    }
  };

  private _stdout: string[] = [];
  get stdout() {
    return this._stdout.join('');
  }

  private _stderr: string[] = [];
  get stderr() {
    return this._stderr.join('');
  }

  private _code: number | undefined;
  get code() {
    return this._code;
  }

  private _closed: Promise<void>;
  get closed() {
    return this._closed;
  }

  private _childProcess: ChildProcess;

  constructor(childProcess: ChildProcess) {
    this._childProcess = childProcess;
    const { promise, resolve } = Promise.withResolvers<void>();
    this._closed = promise;
    this._childProcess.stdout?.on('data', (data: string) => {
      logger.debug({ source: 'process', processId: this._childProcess.pid, message: data, data: { type: 'stdout' }});
      this._stdout.push(data);
    });
    this._childProcess.stderr?.on('data', (data: string) => {
      logger.debug({ source: 'process', processId: this._childProcess.pid, message: data, data: { type: 'stderr' }});
      this._stderr.push(data);
    });
    this._childProcess.on('close', (code) => {
      this._code = code ?? 0;
      logger.debug({ source: 'process', processId: this._childProcess.pid, message: 'closed', data: { code: this._code }});
      resolve();
    });
  }
}
