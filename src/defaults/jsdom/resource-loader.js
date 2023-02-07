module.exports = ({
  jsdom,
  networkWriter,
  consoleWriter
}) => {
  const { ResourceLoader: JSDOMResourceLoader } = jsdom

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
      return request
    }
  }

  return new ResourceLoader()
}
