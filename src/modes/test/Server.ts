import { assert, Exit, logger, Thread } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { serve } from 'reserve';
import type { Server as REserveServer } from 'reserve';
import { toPlainObject } from '../../utils/shared/object.js';
import { buildREserveConfiguration } from './reserve.js';

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

  reserveServer.on('created', () => {
    logger.debug({ source: 'reserve', message: 'created', data: {} });
  });
  for (const eventName of ['incoming', 'redirecting', 'redirected', 'aborted', 'closed'] as const) {
    reserveServer.on(eventName, (event) => {
      const { eventName: message, ...data } = event;
      logger.debug({ source: 'reserve', message, data });
    });
  }

  reserveServer
    .on('ready', (event) => {
      const { eventName: message, ...data } = event;
      logger.debug({ source: 'reserve', message, data });
      logger.info({ source: 'server', message: `Server listening on: ${event.url}` });
      _channel.postMessage({
        command: 'ready',
        port: event.port
      } satisfies Message);
    })
    .on('error', (event) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- REserve uses any
      const { eventName: message, reason: error, ...data } = event;
      logger.debug({ source: 'reserve', message, data, error });
      _channel.postMessage({
        command: 'error'
      } satisfies Message);
    });
};
