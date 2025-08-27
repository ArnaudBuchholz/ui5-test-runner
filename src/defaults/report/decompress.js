/* global DecompressionStream */
// eslint-disable-next-line no-unused-vars
async function decompress (base64) {
  const bin = atob(base64)
  const uint8Array = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; ++i) {
    uint8Array[i] = bin.charCodeAt(i)
  }
  const readableStream = new ReadableStream({
    start (ctl) {
      ctl.enqueue(uint8Array)
      ctl.close()
    }
  })
  const decompressionStream = new DecompressionStream('gzip')
  const decompressedStream = readableStream.pipeThrough(decompressionStream)
  const jsonString = await new Response(decompressedStream).text()
  return JSON.parse(jsonString)
}
