const { body } = require('reserve')

module.exports = async (request, response) => {
  console.log(request.headers.referer, JSON.parse(await body(request)))
  response.writeHead(200)
  response.end()
}
