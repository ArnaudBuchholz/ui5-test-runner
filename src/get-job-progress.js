'use strict'

module.exports = {
  async getJobProgress (job, request, response, pageId) {
    let json
    if (pageId) {
      const pageUrl = Object.keys(job.qunitPages).find(url => job.qunitPages[url].id === pageId)
      if (pageUrl === undefined) {
        response.writeHead(404)
        response.end()
        return
      }
      json = JSON.stringify({
        url: pageUrl,
        ...job.qunitPages[pageUrl]
      }, undefined, 2)
    } else {
      json = JSON.stringify({
        ...job,
        status: job.status
      }, (key, value) => {
        if (key === 'modules') {
          return undefined
        }
        return value
      }, 2)
    }
    const length = (new TextEncoder().encode(json)).length
    response.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Length': length
    })
    response.end(json)
  }
}
