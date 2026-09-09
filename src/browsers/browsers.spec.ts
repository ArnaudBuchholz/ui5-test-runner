import { vi, beforeAll, afterAll } from 'vitest';
import { testBrowser } from './browser.test.js';
import { Npm } from '../Npm.js';
import { serve } from 'reserve';
import type { Server } from 'reserve';
import { agentLogPrefix } from '../types/AgentState.js';
// Need to import native APIs to enable testing
import { rmdir, mkdir } from 'node:fs/promises';
import { __sourcesRoot, Path } from '../platform/index.js';

const mockNpmImport = vi.spyOn(Npm, 'import');

let server: Server;

beforeAll(async () => {
  const temporaryPath = Path.join(__sourcesRoot, `../tmp`);
  await rmdir(temporaryPath, { recursive: true });
  await mkdir(temporaryPath, { recursive: true });

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
        match: '/network.html',
        custom: () => [
          `<html>
            <script src="hello.js"></script>
            <script src="not_found.js"></script>
            <script src="server_error.js"></script>
          </html>`,
          { headers: { 'content-type': 'text/html; charset=UTF-8' } }
        ]
      },
      {
        match: '/hello.js',
        custom: () => [
          `console.log('Hello World !')`,
          { headers: { 'content-type': 'text/javascript; charset=UTF-8' } }
        ]
      },
      {
        match: '/page.html',
        custom: () => [
          `<html><h1>Hello World !</h1></html>`,
          { headers: { 'content-type': 'text/html; charset=UTF-8' } }
        ]
      },
      {
        match: '/server_error.js',
        status: 500
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
});

afterAll(() => server.close());

testBrowser({
  name: 'puppeteer',
  failedSetupTestCases: [
    {
      label: 'launch fails',
      setup: () => {
        mockNpmImport.mockResolvedValueOnce({
          launch() {
            throw new Error('Failed');
          }
        });
      }
    }
  ]
});
