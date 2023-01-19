report.ready.then(update => {
  update(job)
  window.addEventListener('hashchange', () => {
    const [, pageId, testId] = location.hash.match(/#?([^-]*)(?:-(.*))?/)
    job.qunitPage = null
    job.qunitTest = null
    if (pageId) {
      const url = Object.keys(job.qunitPages).find(pageUrl => job.qunitPages[pageUrl].id === pageId)
      if (!url) {
        return
      }
      const qunitPage = { url, ...job.qunitPages[url] }
      if (testId) {
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
        if (test) {
          job.qunitTest = {
            url,
            pageId,
            module: moduleName,
            ...test
          }
        }
      } else {
        job.qunitPage = qunitPage
      }
      update(job)
    }
  })
})
