const { join } = require('path')
const { readFile } = require('fs/promises')

module.exports = async (request, response) => {
  const { referer } = request.headers
  if (!referer || referer.endsWith('progress.html')) {
    response.writeHead(308, {
      location: '/_/report/progress.js'
    })
  } else {
    response.writeHead(200, {
      'content-type': 'text/javascript'
    })
    response.write(`const module = {}
`)
    response.write((await readFile(join(__dirname, 'job.js'))).toString())
    response.write(`const job = module.exports
`)
    response.write((await readFile(join(__dirname, '../../src/defaults/report/main.js'))).toString())
  }
  response.end()
}
