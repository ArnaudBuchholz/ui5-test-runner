(function () {
  /* global report */

  report.ready.then(update => {
    let lastState = {}
    async function refresh () {
      let json
      const hash = location.hash ? location.hash.substring(1) : ''
      try {
        let response
        if (hash) {
          response = await fetch(`/_/progress?page=${hash}`)
        } else {
          response = await fetch('/_/progress')
        }
        json = await response.json()
      } catch (e) {
        update({
          ...lastState,
          disconnected: true
        })
        return
      }
      if (hash) {
        lastState = {
          ...json,
          pageId: hash
        }
      } else {
        lastState = {
          ...json,
          qunitPagesUrl: Object.keys(json.qunitPages || {})
        }
      }
      console.log(lastState)
      update({
        ...lastState,
        disconnected: false,
        elapsed: report.elapsed
      })
      setTimeout(refresh, 250)
    }
    refresh()
  })
}())
