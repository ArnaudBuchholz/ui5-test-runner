'use strict'

const { join } = require('path')

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
    settings: { url, scripts, modules },
    // options
  }) {
    const happyDom = require(modules['happy-dom'])
    const { Browser } = happyDom;
    const browser = new Browser();
    const page = browser.newPage();
    scripts.forEach(script => page.mainFrame.window.eval(script));
    page.goto(url);
  }
})
