const { readFileSync } = require('fs')
const { join } = require('path')

module.exports = (request, response) => {
  const report = readFileSync(join(__dirname, 'report.html'))
    .toString()
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
  const html = `<html>
  <body>
    <iframe srcdoc="${report}" width="90%" height="90%"></iframe>
  </body>
</html>`
  response.writeHead(200, {
    'content-type': 'text/html',
    'content-length': html.length
  })
  response.end(html)
}
