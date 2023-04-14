/* global report, job */
report.ready.then(update => {
  const hashChange = hash => {
    const [, pageId, testId] = (hash || '').match(/#?([^-]*)(?:-(.*))?/)
    let [qunitPage, qunitTest] = [null, null]
    if (pageId) {
      const url = Object.keys(job.qunitPages).find(pageUrl => job.qunitPages[pageUrl].id === pageId)
      if (!url) {
        return
      }
      qunitPage = { url, ...job.qunitPages[url] }
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
        qunitPage = null
        if (test) {
          qunitTest = {
            url,
            pageId,
            module: moduleName,
            ...test
          }
        }
      }
    }
    update({
      ...job,
      qunitPage,
      qunitTest,
      elapsed: report.elapsed
    })
  }

  window.addEventListener('hashchange', () => {
    hashChange(location.hash)
  })
  if (window.location.href === 'about:srcdoc') {
    window.addEventListener('click', (event) => {
      const { href } = event.target
      if (href) {
        const lastHash = href.lastIndexOf('#')
        hashChange(href.substring(lastHash))
      }
      event.preventDefault()
      return false
    })
  }
  hashChange(location.hash)
})
