'use strict'

const { boolean } = require('../options')

require('./browser')({
  name: 'jsdom',

  options (command) {
    command
      .option('--debug [flag]', 'Enable more traces', boolean, false)
  },

  capabilities () {
    return {
      modules: ['jsdom'],
      scripts: true,
      traces: ['console', 'network']
    }
  },

  async run ({
    settings: { url, scripts, modules },
    options,
    consoleWriter,
    networkWriter
  }) {
    const jsdom = require(modules.jsdom)
    const { JSDOM, VirtualConsole } = jsdom

    const virtualConsole = new VirtualConsole()
    virtualConsole.on('error', (...args) => consoleWriter.append({ type: 'error', text: args.join(' ') }))
    virtualConsole.on('warn', (...args) => consoleWriter.append({ type: 'warning', text: args.join(' ') }))
    virtualConsole.on('info', (...args) => consoleWriter.append({ type: 'info', text: args.join(' ') }))
    virtualConsole.on('log', (...args) => consoleWriter.append({ type: 'log', text: args.join(' ') }))

    JSDOM.fromURL(url, {
      includeNodeLocations: true,
      storageQuota: 10000000,
      runScripts: 'dangerously',
      pretendToBeVisual: true,
      virtualConsole,
      resources: require('./jsdom/resource-loader')({
        jsdom,
        networkWriter,
        consoleWriter
      }),
      beforeParse (window) {
        require('./jsdom/compatibility')({ window, networkWriter })
        if (options.debug) {
          require('./jsdom/debug')(window)
        }
        scripts.forEach(script => window.eval(script))
      }
    })
  }
})
