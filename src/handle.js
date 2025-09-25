const { ServerResponse } = require('http')

module.exports = {
  describeHandle (handle) {
    const className = handle && handle.constructor && handle.constructor.name
    let label = className
    if (['TLSSocket', 'Socket'].includes(className)) {
      if (handle._httpMessage instanceof ServerResponse) {
        const { path, method, host, protocol } = handle._httpMessage.req
        label += ` HTTP ${method} ${protocol}//${host}${path}`
      } else if (handle.localAddress) {
        const { localAddress, localPort, remoteAddress, remotePort } = handle
        label += ` from ${localAddress}:${localPort} to ${remoteAddress}:${remotePort}`
        // } else {
      }
    } else if (className === 'WriteStream') {
      label += ` columns: ${handle.columns} rows: ${handle.rows} fd: ${handle.fd} isTTY: ${handle.isTTY}`
    } else if (className === 'Server') {
      label += ` connections: ${handle._connections} events: ${handle._eventsCount}`
    } else if (className === 'ChildProcess') {
      label += ` pid: ${handle.pid} ${handle.spawnfile}`
    }
    return { className, label }
  }
}
