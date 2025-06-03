'use strict'

const log = (attributes) => {
  console.log(JSON.stringify(attributes, (key, value) => {
    if (key === 'headers' && typeof value === 'object') {
      const literal = {}
      value.forEach((headerValue, headerName) => {
        literal[headerName] = headerValue
      })
      return literal
    }
    return value
  }, 2))
}

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
              log({
                timestamp: new Date().toISOString(),
                channel: 'network',
                type: 'request',
                async: true,
                request: { method, url, headers }
              })
            },
            beforeSyncRequest: ({ request: { method, url, headers } }) => {
              log({
                timestamp: new Date().toISOString(),
                channel: 'network',
                type: 'request',
                async: false,
                request: { method, url, headers }
              })
            },
            afterAsyncResponse: async ({ request: { method, url, headers }, response, window }) => {
              const body = await response.text()
              log({
                timestamp: new Date().toISOString(),
                channel: 'network',
                type: 'response',
                async: true,
                request: { method, url, headers },
                response: {
                  ...response,
                  body
                }
              })
              return new window.Response(body, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              })
            },
            afterSyncResponse: ({ request: { method, url, headers }, response }) => {
              log({
                timestamp: new Date().toISOString(),
                channel: 'network',
                type: 'response',
                async: false,
                request: { method, url, headers },
                response: {
                  ...response,
                  body: response.body.toString('utf8')
                }
              })
            }
          }
        }
      },
      console: {
        error: (...args) => log({
          timestamp: new Date().toISOString(),
          channel: 'console',
          type: 'error',
          message: args.join(' ')
        }),
        warn: (...args) => log({
          timestamp: new Date().toISOString(),
          channel: 'console',
          type: 'warning',
          message: args.join(' ')
        }),
        info: (...args) => log({
          timestamp: new Date().toISOString(),
          channel: 'console',
          type: 'info',
          message: args.join(' ')
        }),
        log: (...args) => log({
          timestamp: new Date().toISOString(),
          channel: 'console',
          type: 'log',
          message: args.join(' ')
        })
      }
    })
    const page = browser.newPage()
    scripts.forEach(script => page.mainFrame.window.eval(script))
    page.goto(url)
  }
})
