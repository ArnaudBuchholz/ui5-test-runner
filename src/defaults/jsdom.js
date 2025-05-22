'use strict'

const { join } = require('path')

require('./browser')({
  metadata: {
    name: 'jsdom',
    options: [
      ['--debug [flag]', 'Enable more traces', false]
    ],
    capabilities: {
      modules: ['jsdom'],
      scripts: true,
      traces: ['multiplex']
    }
  },

  async run ({
    settings: { url, scripts, modules },
    options
  }) {
    const jsdom = require(modules.jsdom)
    const { JSDOM, VirtualConsole } = jsdom

    const virtualConsole = new VirtualConsole()
    virtualConsole.on('jsdomError', (...args) => console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      channel: 'console',
      type: 'jsdomError',
      message: args.join(' ')
    })))
    virtualConsole.on('error', (...args) => console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      channel: 'console',
      type: 'error',
      message: args.join(' ')
    })))
    virtualConsole.on('warn', (...args) => console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      channel: 'console',
      type: 'warning',
      message: args.join(' ')
    })))
    virtualConsole.on('info', (...args) => console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      channel: 'console',
      type: 'info',
      message: args.join(' ')
    })))
    virtualConsole.on('log', (...args) => console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      channel: 'console',
      type: 'log',
      message: args.join(' ')
    })))

    let mainWindow

    const beforeParse = (window) => {
      if (mainWindow === undefined) {
        mainWindow = window
      } else {
        Object.defineProperty(window, 'parent', {
          value: mainWindow,
          writable: false
        })
      }
      require('./jsdom/compatibility')(window)
      if (options.debug) {
        require('./jsdom/debug')(window)
      }
      scripts.forEach(script => window.eval(script))
    }

    // https://github.com/jsdom/jsdom/issues/2920
    const Window = require(join(modules.jsdom, 'lib/jsdom/browser/Window.js'))
    const origCreate = Window.createWindow.bind(Window)
    Window.createWindow = (...args) => {
      const window = origCreate(...args)
      window._virtualConsole = virtualConsole
      beforeParse(window)
      return window
    }

    JSDOM.fromURL(url, {
      includeNodeLocations: true,
      storageQuota: 10000000,
      runScripts: 'dangerously',
      pretendToBeVisual: true,
      virtualConsole,
      resources: require('./jsdom/resource-loader')(jsdom),
      beforeParse
    })
  }
})
