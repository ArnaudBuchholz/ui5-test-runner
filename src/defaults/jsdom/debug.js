module.exports = window => {
  // Proxify sap.ui to hook the loader and enable traces
  window.sap = {
    ui: new Proxy({}, {
      get (obj, prop) {
        console.log('ABZ', 'sap.ui.(get)', prop)
        return obj[prop]
      },
      set (obj, prop, value) {
        console.log('ABZ', 'sap.ui.(set)', prop)
        obj[prop] = value
        if (prop === 'loader') {
          value._.logger = {
            debug: (...args) => console.log('LOADER', ...args),
            info: (...args) => console.info('LOADER', ...args),
            warning: (...args) => console.warn('LOADER', ...args),
            error: (...args) => console.error('LOADER', ...args),
            isLoggable: () => true
          }
        }
        return true
      }
    })
  }
}
