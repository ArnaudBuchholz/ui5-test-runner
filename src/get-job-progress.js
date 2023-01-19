'use strict'

const send = (response, obj) => {
  let json
  if (typeof obj !== 'string') {
    json = JSON.stringify(obj, undefined, 2)
  } else {
    json = obj
  }
  const length = (new TextEncoder().encode(json)).length
  response.writeHead(200, {
    'Content-Type': 'application/json',
    'Content-Length': length
  })
  response.end(json)
}

const notFound = response => {
  response.writeHead(404)
  response.end()
}

module.exports = {
  async getJobProgress (job, request, response, pageId, testId) {
    if (pageId) {
      const url = Object.keys(job.qunitPages).find(pageUrl => job.qunitPages[pageUrl].id === pageId)
      if (!url) {
        return notFound(response)
      }
      const qunitPage = { url, ...job.qunitPages[url] }
      if (!testId) {
        return send(response, JSON.stringify(qunitPage, (key, value) => {
          if (key === 'logs') {
            return undefined
          }
          return value
        }, 2))
      }
      let test
      let moduleName
      qunitPage.modules.every(module => module.tests.every(candidate => {
        if (candidate.testId === testId) {
          moduleName = module.name
          test = candidate
          return false
        }
        return true
      }))
      if (!test) {
        return notFound(response)
      }
      return send(response, {
        url,
        pageId,
        module: moduleName,
        ...test
      })
    }
    send(response, JSON.stringify({
      ...job,
      status: job.status
    }, (key, value) => {
      if (key === 'modules') {
        return undefined
      }
      return value
    }, 2))
  }
}
