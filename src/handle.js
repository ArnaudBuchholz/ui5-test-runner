const { ServerResponse, ClientRequest } = require('node:http')

module.exports = {
  describeHandle (handle) {
    const className = handle && handle.constructor && handle.constructor.name
    let label = className
    if (['TLSSocket', 'Socket'].includes(className)) {
      if (handle._httpMessage instanceof ServerResponse) {
        const { method, url } = handle._httpMessage.req
        label += ` IncomingRequest ${method} ${url}`
      } else if (handle._httpMessage instanceof ClientRequest) {
        const { path, method, host, protocol } = handle._httpMessage
        label += ` ClientRequest ${method} ${protocol}//${host}${path}`
      } else if (handle.localAddress) {
        const { localAddress, localPort, remoteAddress, remotePort } = handle
        if (remoteAddress === undefined) {
          label += ` local ${localAddress}:${localPort}`
        } else {
          label += ` local ${localAddress}:${localPort} remote ${remoteAddress}:${remotePort}`
        }
      } else if (handle._handle) {
        const underlyingHandle = handle._handle
        const underlyingClassName = underlyingHandle && underlyingHandle.constructor && underlyingHandle.constructor.name
        label += ` <-> ${underlyingClassName || 'unknown'}`
      } else {
        label += ' unknown'
      }
    } else if (className === 'WriteStream') {
      const fd = ['stdin', 'stdout', 'stderr'][handle.fd] || `fd: ${handle.fd}`
      label += ` ${fd} ${handle.columns}x${handle.rows} isTTY: ${handle.isTTY}`
    } else if (className === 'ReadStream') {
      const fd = ['stdin', 'stdout', 'stderr'][handle.fd] || `fd: ${handle.fd}`
      label += ` ${fd} isTTY: ${handle.isTTY}`
    } else if (className === 'Server') {
      label += ` connections: ${handle._connections} events: ${handle._eventsCount}`
    } else if (className === 'ChildProcess') {
      label += ` pid: ${handle.pid}`
      if (handle.spawnargs) {
        label += ` ${handle.spawnargs.map(value => ('' + value).replaceAll(/ /g, '␣'))}`
      } else {
        label += ' unknown'
      }
    }
    return { className, label }
  }
}
