(function () {
  report.ready.then(update => {
    let lastState = {}
    async function refresh () {
      let json
      try {
        const response = await fetch('/_/progress')
        json = await response.json()
      } catch (e) {
        update({
          ...lastState,
          disconnected: true
        })
      }
      lastState = {
        ...json,
        disconnected: false,
        qunitPagesUrl: Object.keys(json.qunitPages || {})
      }
      update({
        ...lastState,
        elapsed: report.elapsed
    })
      setTimeout(refresh, 250)
    }
    refresh()
  })
}())
