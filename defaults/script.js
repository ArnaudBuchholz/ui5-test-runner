const log = console.log.bind(console)

console.log = (...args) => {
  log('ABUBU', ...args)
}
