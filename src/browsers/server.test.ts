import { serve } from 'reserve';
import type { Server } from 'reserve';

let server: Server;

export async function setup() {
  server = serve({
    port: 0,
    mappings: [
      {
        status: 404
      }
    ]
  });
  const { promise, resolve } = Promise.withResolvers<void>();
  server.on('ready', ({ url }) => {
    process.env['BROWSERS_SERVER_URL'] = url;
    resolve();
  });
  return promise;
}

export async function teardown() {
  await server.close();
}
