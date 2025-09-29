module.exports = async function scanUI5 (url, onFolder, onFile) {
  if (url.match(/\/((?:test-)?resources\/.*)/)) {
    return // ignore UI5 resources
  }
  let html
  try {
    html = await (await fetch(url)).text()
  } catch (e) {
    e.url = url
    throw e
  }
  const items = [...html.matchAll(/<a href="([^"]+)" class="icon/ig)]
    .map(([_, item]) => item)
    .filter(item => item.endsWith('/') || item.endsWith('.js') || item.endsWith('.ts'))
  await onFolder(items.length)
  for (const item of items) {
    const itemUrl = new URL(item, url).toString()
    if (item.endsWith('/')) {
      await scanUI5(itemUrl, onFolder, onFile)
    } else if (item.endsWith('.ts')) {
      await onFile(itemUrl, await (await fetch(itemUrl.replace(/\.ts$/, '.js'))).text())
    } else {
      await onFile(itemUrl, await (await fetch(itemUrl + '?instrument=true')).text())
    }
  }
}
