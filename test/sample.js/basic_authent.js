'use strict'

module.exports = (request, response, url) => {
  if (request.headers.authorization) {
    const buffer = Buffer.from(/Basic (.*)/.exec(request.headers.authorization)[1], 'base64')
    const nameAndPassword = buffer.toString('ascii').split(':')
    if (nameAndPassword[0] === 'testUsername' && nameAndPassword[1] === 'testPassword') {
      return
    }
  }
  response.writeHead(401, {
    'WWW-Authenticate': 'Basic realm=""'
  })
  response.end()
}
