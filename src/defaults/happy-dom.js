'use strict'

require('./browser')({
  metadata: {
    name: 'happy-dom',
    options: [
      ['--debug [flag]', 'Enable more traces', false]
    ],
    capabilities: {
      modules: ['happy-dom'],
      scripts: true,
      traces: ['multiplex']
    }
  },

  async run ({
    settings: { url, scripts, modules }
    // options
  }) {
    const happyDom = require(modules['happy-dom'])
    const { Browser } = happyDom
    const browser = new Browser({
      settings: {
        fetch: {
          interceptor: {
            beforeAsyncRequest: async ({ request: { method, url, headers } }) => {
              console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                channel: 'network',
                type: 'request',
                async: true,
                request: { method, url, headers }
              }))
            },
            beforeSyncRequest: ({ request: { method, url, headers } }) => {
              console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                channel: 'network',
                type: 'request',
                async: false,
                request: { method, url, headers }
              }))
            },
            afterAsyncResponse: async ({ request: { method, url, headers }, response, window }) => {
              const body = await response.text()
              console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                channel: 'network',
                type: 'response',
                async: true,
                request: { method, url, headers },
                response: {
                  ...response,
                  body
                }
              }))
              return new window.Response(body, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              })
            },
            afterSyncResponse: ({ request: { method, url, headers }, response }) => {
              console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                channel: 'network',
                type: 'response',
                async: false,
                request: { method, url, headers },
                response
              }))
            }
          }
        }
      },
      console: {
        error: (...args) => console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          channel: 'console',
          type: 'error',
          message: args.join(' ')
        })),
        warn: (...args) => console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          channel: 'console',
          type: 'warning',
          message: args.join(' ')
        })),
        info: (...args) => console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          channel: 'console',
          type: 'info',
          message: args.join(' ')
        })),
        log: (...args) => console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          channel: 'console',
          type: 'log',
          message: args.join(' ')
        }))
      }
    })
    const page = browser.newPage()
    scripts.forEach(script => page.mainFrame.window.eval(script))
    page.goto(url)
  }
})
