import type { ChildProcess, SpawnOptions } from 'node:child_process';
import { spawn } from 'node:child_process';
import { logger } from './logger.js';

export interface IProcess {
  readonly stdout: string;
  readonly stderr: string;
  readonly code: number | undefined;
  readonly closed: Promise<void>;
}

export class Process implements IProcess {
  private static _list: Process[] = [];
  static get list(): readonly Process[] {
    return Process._list;
  }

  // TODO: invert dependency by having a central mechanism to register pending processes and know when to stop
  private static _stopped = false;
  static async stop() {
    Process._stopped = true;
    await Promise.allSettled(Process._list.map((process) => process.closed));
  }

  static readonly spawn: (command: string, arguments_: string[], options?: SpawnOptions) => IProcess = (
    command,
    arguments_,
    options = {}
  ) => {
    if (command === 'node') {
      command = process.argv[0] as string;
    }
    try {
      if (Process._stopped) {
        throw new Error('stop called');
      }
      const childProcess = spawn(command, arguments_, options);
      logger.debug({
        source: 'process',
        processId: childProcess.pid,
        message: 'spawn',
        data: { command, arguments: arguments_, options }
      });
      return new Process(childProcess);
    } catch (error) {
      logger.error({
        source: 'process',
        message: 'spawn failed',
        data: { command, arguments: arguments_, options },
        error
      });
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
    Process._list.push(this);
    this._childProcess = childProcess;
    const { promise, resolve } = Promise.withResolvers<void>();
    this._closed = promise;
    this._childProcess.stdout?.on('data', (buffer: Buffer) => {
      const message = buffer.toString();
      logger.debug({ source: 'process', processId: this._childProcess.pid, message, data: { type: 'stdout' } });
      this._stdout.push(message);
    });
    this._childProcess.stderr?.on('data', (buffer: Buffer) => {
      const message = buffer.toString();
      logger.debug({ source: 'process', processId: this._childProcess.pid, message, data: { type: 'stderr' } });
      this._stderr.push(message);
    });
    this._childProcess.on('close', (code) => {
      this._code = code ?? 0;
      logger.debug({
        source: 'process',
        processId: this._childProcess.pid,
        message: 'closed',
        data: { code: this._code }
      });
      const index = Process._list.indexOf(this);
      Process._list.splice(index, 1);
      resolve();
    });
  }
}
