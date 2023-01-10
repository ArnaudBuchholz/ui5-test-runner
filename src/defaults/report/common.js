(function () {
  /* global punybind, punyexpr */

  const report = {}

  report.elapsed = function (start, end = Date.now()) {
    if (typeof end === 'string') {
      end = new Date(end).getTime()
    }
    if (typeof start === 'string') {
      start = new Date(start).getTime()
    }
    const ms = end - start
    if (isNaN(ms)) {
      return '-'
    }
    if (ms > 5000) {
      const mins = Math.floor(ms / 60000)
      const secs = Math.floor((ms % 60000) / 1000)
      return `${mins.toString().padStart(2, 0)}:${secs.toString().padStart(2, 0)}`
    }
    return `${ms} ms`
  }

  let setReady
  report.ready = new Promise(resolve => {
    setReady = resolve
  })

  window.addEventListener('load', () => {
    const safebind = punybind.use({
      compiler: punyexpr
    })
    safebind(document.body).then(setReady)
  })

  window.report = report
}())
