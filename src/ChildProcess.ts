import type { ChildProcess as NativeChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';

export class ChildProcess {
  static spawn (command: string, args: string[]): ChildProcess {
    try {
      return new ChildProcess(spawn(command, args))
    } catch (error) {

      throw error;
    }
  }

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

  private constructor (
    private _native: NativeChildProcess
  ) {
    const { promise, resolve } = Promise.withResolvers<void>();
    this._closed = promise;
    this._native.stdout?.on('data', (data) => {
      this._stdout.push(data);
    });
    this._native.stderr?.on('data', (data) => {
      this._stderr.push(data);
    });
    this._native.on('close', (code) => {
      this._code = code ?? 0;
      resolve();
    });
  }

  abort() {

  }
}
