import type { ChildProcess, SpawnOptions } from 'node:child_process';
import { Host } from './Host.js';
import { spawn } from 'node:child_process';
import { logger } from './logger.js';
import { Exit } from './Exit.js';
import type { IRegisteredAsyncTask } from './Exit.js';

export interface IProcess {
  readonly pid: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly code: number | undefined;
  readonly closed: Promise<void>;
}

class ProcessStopper {
  private _process: Process | undefined;

  set process(value: Process) {
    this._process = value;
  }

  async stop() {
    await this._process?.kill();
    return this._process?.closed;
  }
}

export class Process implements IProcess {
  static readonly spawn: (command: string, arguments_: string[], options?: SpawnOptions) => IProcess = (
    command,
    arguments_,
    options = {}
  ) => {
    const finalCommand = command === 'node' ? (process.argv[0] as string) : command;
    let asyncTask: IRegisteredAsyncTask | undefined;
    try {
      const stopper = new ProcessStopper();
      asyncTask = Exit.registerAsyncTask({
        name: `Process.spawn(${command},${arguments_.join(',')})`,
        stop: () => stopper.stop()
      });
      const childProcess = spawn(finalCommand, arguments_, options);
      logger.debug({
        source: 'process',
        processId: childProcess.pid,
        message: 'spawned',
        data: { command, arguments: arguments_, options }
      });
      const process = new Process(childProcess, asyncTask);
      stopper.process = process;
      return process;
    } catch (error) {
      logger.error({
        source: 'process',
        message: 'spawn failed',
        data: { command, arguments: arguments_, options },
        error
      });
      asyncTask?.unregister();
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
  private _asyncTask: IRegisteredAsyncTask;

  constructor(childProcess: ChildProcess, asyncTask: IRegisteredAsyncTask) {
    this._childProcess = childProcess;
    this._asyncTask = asyncTask;
    const { promise, resolve } = Promise.withResolvers<void>();
    this._closed = promise;
    this._childProcess.stdout?.on('data', (buffer: Buffer) => {
      const message = buffer.toString();
      logger.debug({ source: 'process', processId: this.pid, message, data: { type: 'stdout' } });
      this._stdout.push(message);
    });
    this._childProcess.stderr?.on('data', (buffer: Buffer) => {
      const message = buffer.toString();
      logger.debug({ source: 'process', processId: this.pid, message, data: { type: 'stderr' } });
      this._stderr.push(message);
    });
    this._childProcess.on('close', (code) => {
      this._code = code ?? 0;
      logger.debug({
        source: 'process',
        processId: this.pid,
        message: 'closed',
        data: { code: this._code }
      });
      this._asyncTask.unregister();
      resolve();
    });
  }

  get pid(): number {
    return this._childProcess.pid!;
  }

  async kill(): Promise<void> {
    logger.debug({
      source: 'process',
      processId: this.pid,
      message: 'kill'
    });
    try {
      if (Host.platform() === 'win32') {
        // eslint-disable-next-line sonarjs/no-os-command-from-path -- secure
        const killProcess = spawn('taskkill', ['/F', '/T', '/PID', this.pid.toString()], {
          windowsHide: true
        });
        // No supervision required, supposed to be fast
        const { promise, resolve } = Promise.withResolvers<void>();
        killProcess.on('close', resolve);
        await promise;
      } else {
        try {
          // First try to kill process tree
          process.kill(-this.pid);
        } catch {
          // Otherwise, kill the process only
          process.kill(this.pid);
        }
      }
      logger.debug({
        source: 'process',
        processId: this.pid,
        message: 'killed'
      });
    } catch (error) {
      logger.debug({
        source: 'process',
        processId: this.pid,
        message: 'unable to kill',
        error
      });
    }
  }
}
