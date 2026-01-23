import { ServerResponse, ClientRequest } from 'node:http';
import { ANSI_BLUE, ANSI_RED, ANSI_WHITE } from '../terminal/ansi.js';
import { __developmentMode } from './constants.js';
import { Thread } from './Thread.js';
import { assert } from './assert.js';
import type { ILogger } from './logger/types.js';

let logger: ILogger | undefined;

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

export class ExitShutdownError extends Error {
  constructor() {
    super('Exiting application');
    this.name = 'ExitShutdownError';
  }
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

const isStdStream = (handle: Handle) => ('fd' in handle) && handle.fd >= 0 && handle.fd < 3;

const unknownHandleDescriptor = () => 'unknown';

const describeHandle = (handle: Handle) => {
  const className = handle && handle.constructor && handle.constructor.name;
  return { className, label: className + ' ' + (handleDescriptors[className] ?? unknownHandleDescriptor)(handle) };
};

export class Exit {
  private static _asyncTaskId = 0;
  private static _asyncTasks: InternalAsyncTask[] = [];

  private static _checkForHandlesLeak() {
    const undocumentedProcess = process as { _getActiveHandles?: () => Handle[] };
    const activeHandles: Handle[] = undocumentedProcess._getActiveHandles
      ? undocumentedProcess._getActiveHandles()
      : [];
    let messagePortFound = false;
    for (const handle of activeHandles) {
      const { className, label } = describeHandle(handle);
      if (isStdStream(handle)) {
        logger?.debug({ source: 'exit/handle', message: `${className} ${label}` });
      } else if (className === 'MessagePort' && !messagePortFound) {
        // One MessagePort is expected to remain because of the BroadcastChannel
        messagePortFound = true;
        logger?.debug({ source: 'exit/handle', message: `${className} ${label}` });
      } else {
        logger?.warn({ source: 'exit/handle', message: `possible leak ${className} ${label}` });
        if (className === 'TLSSocket' || className === 'Socket') {
          handle.destroy();
        }
      }
    }
  }

  static set code(code: number) {
    assert(Thread.isMainThread, 'Exit.code can be set only on main thread');
    process.exitCode = code;
  }

  static registerAsyncTask(task: IAsyncTask): IRegisteredAsyncTask {
    assert(Thread.isMainThread, 'Exit.registerAsyncTask can be called only on main thread');
    if (Exit._enteringShutdown) {
      throw new ExitShutdownError();
    }
    const id = ++Exit._asyncTaskId;
    this._asyncTasks.push({
      id,
      ...task
    });
    return {
      unregister() {
        const index = Exit._asyncTasks.findIndex((task) => task.id === id);
        try {
          assert(index !== -1, 'unable to find Exit async task to unregister');
          Exit._asyncTasks.splice(index, 1);
        } catch {
          // ignore
        }
      }
    };
  }

  private static _enteringShutdown = false;

  static async shutdown() {
    assert(Thread.isMainThread, 'Exit.shutdown can be called only on main thread');
    Exit._enteringShutdown = true;
    while (Exit._asyncTasks.length > 0) {
      const task = Exit._asyncTasks[0]!; // length > 0
      try {
        logger?.debug({ source: 'exit', message: `Stopping ${task.name}...` });
        // TODO: can we wait for task to be unregistered ?
        await task.stop();
        logger?.debug({ source: 'exit', message: `${task.name} stopped.` });
      } catch (error) {
        logger?.debug({ source: 'exit', message: `Failed while stopping ${task.name}...`, error });
      } finally {
        if (task === Exit._asyncTasks[0]) {
          Exit._asyncTasks.shift();
        }
      }
    }
    Exit._checkForHandlesLeak();
    logger?.debug({ source: 'exit', message: `Stopping logger...` });
    await logger?.stop();
    logger?.debug({ source: 'exit', message: `logger stopped.` });
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

const breakDependencyLoopToLogger = async () => {
  const module = await import('./logger.js');
  logger = module.logger;
};

if (Thread.isMainThread) {
  process.on('SIGINT', Exit.sigInt);
  void breakDependencyLoopToLogger();
}
