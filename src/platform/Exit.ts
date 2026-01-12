import { ServerResponse, ClientRequest } from 'node:http';
import { ANSI_BLUE, ANSI_RED, ANSI_WHITE } from '../terminal/ansi.js';
import { __developmentMode } from './constants.js';
import { Thread } from './Thread.js';
import { logger } from '../logger.js';
import { assert } from '../assert.js';

export interface IAsyncTask {
  name: string;
  stop: () => Promise<void>;
}

export interface IRegisteredAsyncTask {
  unregister(): void;
}

interface InternalAsyncTask extends IAsyncTask {
  id: number;
}

const describeHandle = (handle: any) => {
  const className = handle && handle.constructor && handle.constructor.name;
  let label = className;
  if (['TLSSocket', 'Socket'].includes(className)) {
    if (handle._httpMessage instanceof ServerResponse) {
      const { method, url } = handle._httpMessage.req;
      label += ` IncomingRequest ${method} ${url}`;
    } else if (handle._httpMessage instanceof ClientRequest) {
      const { path, method, host, protocol } = handle._httpMessage;
      label += ` ClientRequest ${method} ${protocol}//${host}${path}`;
    } else if (handle.localAddress) {
      const { localAddress, localPort, remoteAddress, remotePort } = handle;
      label +=
        remoteAddress === undefined
          ? ` local ${localAddress}:${localPort}`
          : ` local ${localAddress}:${localPort} remote ${remoteAddress}:${remotePort}`;
    } else if (handle._handle) {
      const underlyingHandle = handle._handle;
      const underlyingClassName = underlyingHandle && underlyingHandle.constructor && underlyingHandle.constructor.name;
      label += ` <-> ${underlyingClassName || 'unknown'}`;
    } else {
      label += ' unknown';
    }
  } else if (className === 'WriteStream') {
    const fd = ['stdin', 'stdout', 'stderr'][handle.fd] || `fd: ${handle.fd}`;
    label += ` ${fd} ${handle.columns}x${handle.rows} isTTY: ${handle.isTTY}`;
  } else if (className === 'ReadStream') {
    const fd = ['stdin', 'stdout', 'stderr'][handle.fd] || `fd: ${handle.fd}`;
    label += ` ${fd} isTTY: ${handle.isTTY}`;
  } else if (className === 'Server') {
    label += ` connections: ${handle._connections} events: ${handle._eventsCount}`;
  } else if (className === 'ChildProcess') {
    label += ` pid: ${handle.pid}`;
    label += handle.spawnargs
      ? ` ${handle.spawnargs.map((value: string) => ('' + value).replaceAll(' ', '␣'))}`
      : ' unknown';
  }
  return { className, label };
};

export class Exit {
  private static _asyncTaskId = 0;
  private static _asyncTasks: InternalAsyncTask[] = [];

  static checkHandles() {
    const undocumentedProcess = process as any;
    const activeHandles: any[] = undocumentedProcess._getActiveHandles ? undocumentedProcess._getActiveHandles() : [];
    for (const handle of activeHandles) {
      const { className, label } = describeHandle(handle);
      console.log(`${ANSI_BLUE}[~]${ANSI_WHITE}${ANSI_RED}handle ${className}${ANSI_WHITE} ${label}`);
      if (className === 'TLSSocket' || className === 'Socket') {
        handle.destroy();
      }
    }
  }

  static set code(code: number) {
    process.exitCode = code;
  }

  static registerAsyncTask(task: IAsyncTask): IRegisteredAsyncTask {
    const id = ++Exit._asyncTaskId;
    this._asyncTasks.push({
      id,
      ...task
    });
    return {
      unregister() {
        const index = Exit._asyncTasks.findIndex((task) => task.id === id);
        assert(index !== -1, 'unregister called but task not found');
        Exit._asyncTasks.splice(index, 1);
      }
    };
  }

  static async shutddown() {
    for (const task of Exit._asyncTasks) {
      try {
        logger.debug({ source: 'exit', message: `Stopping ${task.name}...` });
        await task.stop();
        logger.debug({ source: 'exit', message: `${task.name} stopped.` });
      } catch (error) {
        logger.debug({ source: 'exit', message: `Failed while stopping ${task.name}...`, error });
      }
    }
    logger.debug({ source: 'exit', message: `Stopping logger...` });
    await logger.stop();
    logger.debug({ source: 'exit', message: `logger stopped.` });
    Exit.checkHandles();
  }

  static sigInt() {
    if (__developmentMode) {
      console.log(`${ANSI_BLUE}[~]${ANSI_WHITE}${ANSI_RED}SIGINT${ANSI_WHITE} received`);
    }
    void Exit.shutddown();
  }
}

if (Thread.isMainThread) {
  process.on('SIGINT', Exit.sigInt);
}
