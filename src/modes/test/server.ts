import { assert, Exit, logger, Thread } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { serve } from 'reserve';

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

type ServerConfiguration = {
  port: number;
};

let channel: ReturnType<typeof Thread.createBroadcastChannel>;
let serverWorker: ReturnType<typeof Thread.createWorker> | undefined;

export const server = {
  async start(configuration: Configuration): Promise<number> {
    assert(serverWorker === undefined);
    channel = Thread.createBroadcastChannel('server');
    Exit.registerAsyncTask({
      name: 'server',
      stop: () => server.stop()
    });
    logger.debug({ source: 'server', message: 'Starting server' });
    const serverConfiguration: ServerConfiguration = {
      port: configuration.port ?? 0
    };
    serverWorker = Thread.createWorker('modes/test/server', serverConfiguration);
    const { promise, resolve, reject } = Promise.withResolvers<number>();
    channel.onmessage = ({ data: message }: { data: Message }) => {
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
    try {
      assert(serverWorker !== undefined);
      logger.debug({ source: 'server', message: 'Stopping server' });
      channel.postMessage({
        command: 'terminate'
      } satisfies Message);
      const { promise, resolve } = Promise.withResolvers<void>();
      channel.onmessage = ({ data: message }: { data: Message }) => {
        if (message.command === 'terminated') {
          channel.close();
          resolve();
        }
      };
      await promise;
    } finally {
      channel.close();
    }
  }
};

export const workerMain = (serverConfiguration: ServerConfiguration) => {
  logger.debug({ source: 'server', message: 'Starting server...' });
  channel = Thread.createBroadcastChannel('server');

  const server = serve({
    port: serverConfiguration.port,
    mappings: [
      {
        status: 200
      }
    ]
  });

  server.on('created', () => {
    // the properties of the event can't be transmitted through workers
    logger.debug({ source: 'reserve', message: 'created', data: {} });
  });
  for (const eventName of ['incoming', 'redirecting', 'redirected', 'aborted', 'closed'] as const) {
    server.on(eventName, (event) => {
      const { eventName: message, ...data } = event;
      logger.debug({ source: 'reserve', message, data });
    });
  }

  server
    .on('ready', (event) => {
      const { eventName: message, ...data } = event;
      logger.debug({ source: 'reserve', message, data });
      logger.info({ source: 'server', message: `Server listening on: ${event.url}` });
      channel.postMessage({
        command: 'ready',
        port: event.port
      } satisfies Message);
    })
    .on('error', (event) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- REserve uses any
      const { eventName: message, error, ...data } = event;
      logger.debug({ source: 'reserve', message, data, error });
      channel.postMessage({
        command: 'error'
      } satisfies Message);
    });

  channel.onmessage = ({ data: message }: { data: Message }) => {
    if (message.command === 'terminate') {
      logger.debug({ source: 'server', message: 'Stopping server...' });
      void server.close().finally(() => {
        logger.debug({ source: 'server', message: 'Server stopped.' });
        channel.postMessage({
          command: 'terminated'
        } satisfies Message);
        channel.close();
      });
    }
  };
};
