import { ServerResponse, ClientRequest } from 'node:http';
import { ANSI_BLUE, ANSI_RED, ANSI_WHITE } from '../terminal/ansi.js';
import { __developmentMode } from './constants.js';
import { Thread } from './Thread.js';
import { assert } from './assert.js';

export interface IAsyncTask {
  name: string;
  stop: () => void | Promise<void>;
}

export interface IRegisteredAsyncTask {
  unregister(): void;
}

interface InternalAsyncTask extends IAsyncTask {
  id: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, sonarjs/redundant-type-aliases -- No official documentation on handle type
type Handle = any;

const socketHandleDescriptor = (handle: Handle) => {
  if (handle._httpMessage instanceof ServerResponse) {
    const { method, url } = handle._httpMessage.req;
    return `IncomingRequest ${method} ${url}`;
  }
  if (handle._httpMessage instanceof ClientRequest) {
    const { path, method, host, protocol } = handle._httpMessage;
    return `ClientRequest ${method} ${protocol}//${host}${path}`;
  }
  if (handle.localAddress) {
    const { localAddress, localPort, remoteAddress, remotePort } = handle;
    return remoteAddress === undefined
      ? `local ${localAddress}:${localPort}`
      : `local ${localAddress}:${localPort} remote ${remoteAddress}:${remotePort}`;
  } else if (handle._handle) {
    const underlyingHandle = handle._handle;
    const underlyingClassName = underlyingHandle && underlyingHandle.constructor && underlyingHandle.constructor.name;
    return `<-> ${underlyingClassName || 'unknown'}`;
  }
  return 'unknown';
};

const handleDescriptors: { [key in string]: (handle: Handle) => string } = {
  TLSSocket: socketHandleDescriptor,
  Socket: socketHandleDescriptor,
  WriteStream: (handle: Handle) => {
    const fd = ['stdin', 'stdout', 'stderr'][handle.fd] || `fd: ${handle.fd}`;
    return `${fd} ${handle.columns}x${handle.rows} isTTY: ${handle.isTTY}`;
  },
  ReadStream: (handle: Handle) => {
    const fd = ['stdin', 'stdout', 'stderr'][handle.fd] || `fd: ${handle.fd}`;
    return `${fd} isTTY: ${handle.isTTY}`;
  },
  Server: (handle: Handle) => `connections: ${handle._connections} events: ${handle._eventsCount}`,
  ChildProcess: (handle: Handle) => {
    return `pid: ${handle.pid}` + handle.spawnargs
      ? ` ${handle.spawnargs.map((value: string) => ('' + value).replaceAll(' ', '␣'))}`
      : ' unknown';
  }
};

const unknownHandleDescriptor = () => 'unknown';

const describeHandle = (handle: Handle) => {
  const className = handle && handle.constructor && handle.constructor.name;
  return { className, label: className + ' ' + (handleDescriptors[className] ?? unknownHandleDescriptor)(handle) };
};

export class Exit {
  private static _asyncTaskId = 0;
  private static _asyncTasks: InternalAsyncTask[] = [];

  static checkHandles() {
    const undocumentedProcess = process as { _getActiveHandles?: () => Handle[] };
    const activeHandles: Handle[] = undocumentedProcess._getActiveHandles
      ? undocumentedProcess._getActiveHandles()
      : [];
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
    if (Exit._enteringShutdown) {
      throw new Error('Exiting application');
    }
    const id = ++Exit._asyncTaskId;
    this._asyncTasks.push({
      id,
      ...task
    });
    return {
      unregister() {
        const index = Exit._asyncTasks.findIndex((task) => task.id === id);
        assert(index !== -1, 'unable to find Exit async task to unregister');
        Exit._asyncTasks.splice(index, 1);
      }
    };
  }

  private static _enteringShutdown = false;

  static async shutdown() {
    Exit._enteringShutdown = true;
    const { logger } = await import('./logger.js'); // Breaks dependency loop
    while (Exit._asyncTasks.length > 0) {
      const task = Exit._asyncTasks[0]!; // length > 0
      try {
        logger.debug({ source: 'exit', message: `Stopping ${task.name}...` });
        // TODO: can we wait for task to be unregistered ?
        await task.stop();
        logger.debug({ source: 'exit', message: `${task.name} stopped.` });
        if (task === Exit._asyncTasks[0]) {
          Exit._asyncTasks.shift();
        }
      } catch (error) {
        logger.debug({ source: 'exit', message: `Failed while stopping ${task.name}...`, error });
      }
    }
    logger.debug({ source: 'exit', message: `Stopping logger...` });
    await logger.stop();
    logger.debug({ source: 'exit', message: `logger stopped.` });
    Exit.checkHandles();
    if (__developmentMode) {
      console.log(`${ANSI_BLUE}[~]${ANSI_WHITE}done.`);
    }
  }

  static sigInt(this: void) {
    if (__developmentMode) {
      console.log(`${ANSI_BLUE}[~]${ANSI_WHITE}${ANSI_RED}SIGINT${ANSI_WHITE} received`);
    }
    void Exit.shutdown();
  }
}

if (Thread.isMainThread) {
  process.on('SIGINT', Exit.sigInt);
}
