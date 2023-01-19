module.exports = (request, response) => {
  const { referer } = request.headers
  if (referer.endsWith('report.html')) {
    response.writeHead(308, {
      location: '/_/report/report.js'
    })
  } else {
    response.writeHead(308, {
      location: '/_/report/progress.js'
    })
  }
  response.end()
}
