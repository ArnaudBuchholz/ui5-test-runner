module.exports = ({ jsdom, networkWriter }) => {
  const { ResourceLoader: JSDOMResourceLoader } = jsdom

  class ResourceLoader extends JSDOMResourceLoader {
    fetch (url, options) {
      const req = super.fetch(url, options)
      const log = res => {
        networkWriter.append({
          method: 'GET',
          url,
          status: res.statusCode
        })
      }
      req.then(() => log(req.response), () => log(req.response))
      return req
    }
  }

  return new ResourceLoader()
}
