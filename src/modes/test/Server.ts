import { assert, Exit, logger, Thread } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { serve } from 'reserve';
import type { Server as REserveServer } from 'reserve';
import { toPlainObject } from '../../utils/shared/object.js';
import { buildREserveConfiguration } from './reserve.js';
import { logReserve } from '../../reserveLogger.js';

type Message =
  | {
      command: 'ready';
      port: number;
    }
  | {
      command: 'error';
    }
  | {
      command: 'terminate';
    }
  | {
      command: 'terminated';
    };

let _channel: ReturnType<typeof Thread.createBroadcastChannel>;
let _serverWorker: ReturnType<typeof Thread.createWorker> | undefined;
let _isStopping = false;

export const Server = {
  async start(configuration: Configuration): Promise<number> {
    assert(_serverWorker === undefined);
    _channel = Thread.createBroadcastChannel('server');
    Exit.registerAsyncTask({
      name: 'server',
      stop: () => Server.stop()
    });
    _serverWorker = Thread.createWorker('modes/test/Server', toPlainObject(configuration));
    const { promise, resolve, reject } = Promise.withResolvers<number>();
    _channel.onmessage = ({ data: message }: { data: Message }) => {
      if (message.command === 'ready') {
        resolve(message.port);
      } else if (message.command === 'error') {
        reject(new Error('failed to start'));
      } else {
        assert(false, 'unexpected');
      }
    };
    return promise;
  },

  async stop() {
    if (_isStopping) {
      return;
    }
    _isStopping = true;
    try {
      assert(_serverWorker !== undefined);
      _channel.postMessage({
        command: 'terminate'
      } satisfies Message);
      const { promise, resolve } = Promise.withResolvers<void>();
      _channel.onmessage = ({ data: message }: { data: Message }) => {
        if (message.command !== 'terminated') {
          return;
        }

        _channel.close();
        resolve();
      };
      await promise;
    } finally {
      _channel.close();
    }
  }
};

export const workerMain = (configuration: Configuration) => {
  logger.debug({ source: 'server', message: 'Starting server...' });
  _channel = Thread.createBroadcastChannel('server');

  let reserveServer: REserveServer;

  _channel.onmessage = ({ data: message }: { data: Message }) => {
    if (message.command !== 'terminate') {
      return;
    }

    logger.debug({ source: 'server', message: 'Stopping server...' });
    void reserveServer.close().finally(() => {
      logger.debug({ source: 'server', message: 'Server stopped.' });
      _channel.postMessage({
        command: 'terminated'
      } satisfies Message);
      _channel.close();
    });
  };

  try {
    reserveServer = serve(buildREserveConfiguration(configuration));
  } catch (error) {
    logger.error({ source: 'server', message: 'An error occurred while configuring', error });
    _channel.postMessage({
      command: 'error'
    } satisfies Message);
    return;
  }

  logReserve(reserveServer);

  reserveServer
    .on('ready', (event) => {
      _channel.postMessage({
        command: 'ready',
        port: event.port
      } satisfies Message);
    })
    .on('error', () => {
      _channel.postMessage({
        command: 'error'
      } satisfies Message);
    });
};
