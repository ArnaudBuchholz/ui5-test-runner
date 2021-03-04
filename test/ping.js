module.exports = (request, response) => {
  response.writeHead(200)
  response.end()
  console.log(request.headers.referer, (new Date()).toISOString())
}
