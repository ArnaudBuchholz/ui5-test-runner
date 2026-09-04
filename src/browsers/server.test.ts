import { serve } from 'reserve';
import type { Server } from 'reserve';
import { agentLogPrefix } from '../types/AgentState.js';

let server: Server;

export async function setup() {
  server = serve({
    port: 0,
    mappings: [
      {
        match: '/console-log.html',
        custom: () => [
          `<html><script>console.log('Hello World !')</script></html>`,
          { headers: { 'content-type': 'text/html; charset=UTF-8' } }
        ]
      },
      {
        match: '/console-warn.html',
        custom: () => [
          `<html><script>console.warn('Hello World !')</script></html>`,
          { headers: { 'content-type': 'text/html; charset=UTF-8' } }
        ]
      },
      {
        match: '/console-error.html',
        custom: () => [
          `<html><script>console.error('Hello World !')</script></html>`,
          { headers: { 'content-type': 'text/html; charset=UTF-8' } }
        ]
      },
      {
        match: '/console-debug.html',
        custom: () => [
          `<html><script>console.debug('Hello World !')</script></html>`,
          { headers: { 'content-type': 'text/html; charset=UTF-8' } }
        ]
      },
      {
        match: '/agent-log.html',
        custom: () => [
          `<html><script>console.debug('${agentLogPrefix}Hello World !')</script></html>`,
          { headers: { 'content-type': 'text/html; charset=UTF-8' } }
        ]
      },
      {
        match: '/agent-warn.html',
        custom: () => [
          `<html><script>console.warn('${agentLogPrefix}Hello World !')</script></html>`,
          { headers: { 'content-type': 'text/html; charset=UTF-8' } }
        ]
      },
      {
        match: '/agent-error.html',
        custom: () => [
          `<html><script>console.error('${agentLogPrefix}Hello World !')</script></html>`,
          { headers: { 'content-type': 'text/html; charset=UTF-8' } }
        ]
      },
      {
        status: 404
      }
    ]
  });
  const { promise, resolve } = Promise.withResolvers<void>();
  server.on('ready', ({ port }) => {
    process.env['BROWSERS_SERVER_URL'] = `http://localhost:${port}/`;
    resolve();
  });
  return promise;
}

export async function teardown() {
  await server.close();
}
