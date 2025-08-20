const { readFileSync } = require('fs')

const [,, harPath, fromPort, toPort] = process.argv
const har = JSON.parse(readFileSync(harPath, 'utf8'))

const main = async () => {
  const differences = 0

  for (const entry of har.log.entries) {
    const { url } = entry.request
    const parsedUrl = new URL(url)
    parsedUrl.port = fromPort
    const fromUrl = parsedUrl.toString()
    parsedUrl.port = toPort
    const toUrl = parsedUrl.toString()
    const [fromResponse, toResponse] = await Promise.all([fetch(fromUrl), fetch(toUrl)])
    if (fromResponse.status === 200 && toResponse.status === 200) {
      const [fromContent, toContent] = await Promise.all([fromResponse.text(), toResponse.text()])
      if (fromContent !== toContent) {
        const fromLines = fromContent.split('\n')
        const toLines = toContent.split('\n')
        if (fromLines.length !== toLines.length) {
          console.log(`❌≠ ${fromUrl}`)
          console.log(`\tfrom: ${fromLines.length} to: ${toLines.length}`)
        } else {
          let showError = true
          for (let lineNumber = 0; lineNumber < fromLines.length; ++lineNumber) {
            const fromLine = fromLines[lineNumber]
            const toLine = toLines[lineNumber]
            if (fromLine !== toLine && !fromLine.includes('* @version')) {
              if (showError) {
                console.log(`❌≠ ${fromUrl}`)
                showError = false
              }
              console.log(`\t@${lineNumber}\n\tfrom: ${fromLine}\n\tto: ${toLine}`)
            }
          }
        }
      }
    } else if (fromResponse.status !== toResponse.status) {
      if (fromResponse.status !== 200) {
        console.log(`❌ ${fromResponse.status} ${fromUrl}`)
      } else {
        console.log(`❌ ${toResponse.status} ${toUrl}`)
      }
    }
  }

  if (differences) {
    process.exitCode = -1
  } else {
    console.log('Other URLs are similar')
  }
}

main()
