module.exports = ({
  jsdom,
  networkWriter,
  consoleWriter
}) => {
  const { ResourceLoader: JSDOMResourceLoader } = jsdom

  const { readFile } = require('fs/promises')
  const { join } = require('path')

  class ResourceLoader extends JSDOMResourceLoader {
    fetch (url, options) {
      const request = super.fetch(url, options)
      const log = reason => {
        const { response } = request
        let status
        if (response === undefined) {
          consoleWriter.append({
            type: 'error',
            message: 'NETWORK ERROR : ' + (reason ? reason.toString() : 'unknown reason')
          })
          status = 599
        } else {
          status = response.statusCode
        }
        networkWriter.append({
          method: 'GET',
          url,
          status
        })
      }
      request.then(log, log)
      if (url.match(/sap\/ui\/test\/matchers\/Visible(-dbg)?.js/)) {
        return request.then(() => {
          return readFile(join(__dirname, 'sap.ui.test.matchers.visible.js'))
        })
      }
      return request
    }
  }

  return new ResourceLoader()
}
