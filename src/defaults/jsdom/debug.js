module.exports = window => {
  // Proxify sap.ui to hook the loader and enable traces
  window.sap = {
    ui: new Proxy({}, {
      get (obj, prop) {
        return obj[prop]
      },
      set (obj, prop, value) {
        obj[prop] = value
        if (prop === 'loader') {
          value._.logger = {
            debug: (...args) => window.console.log('LOADER', ...args),
            info: (...args) => window.console.info('LOADER', ...args),
            warning: (...args) => window.console.warn('LOADER', ...args),
            error: (...args) => window.console.error('LOADER', ...args),
            isLoggable: () => true
          }
        }
        return true
      }
    })
  }
}
