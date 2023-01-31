(function () {
  /* global report */

  report.ready.then(update => {
    let lastState = {}

    async function refresh () {
      const [, page, test] = location.hash.match(/#?([^-]*)(?:-(.*))?/)
      let url = '/_/progress'
      if (page) {
        url += `?page=${page}`
        if (test) {
          url += `&test=${test}`
        }
      }
      let json
      try {
        const response = await fetch(url)
        json = await response.json()
      } catch (e) {
        update({
          ...lastState,
          disconnected: true
        })
        return
      }
      if (test) {
        lastState = {
          qunitTest: json
        }
      } else if (page) {
        lastState = {
          qunitPage: json
        }
      } else {
        lastState = {
          ...json
        }
      }
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
