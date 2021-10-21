let lastCurrent
let lastTotal
let lastTick = 0
const ticks = ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f']

const columns = process.stdout.columns

if (columns) {
  process.stdout.write('\n')
}

function clean () {
  process.stdout.write('\x1b[1F')
  process.stdout.write(''.padEnd(columns, '\u2591'))
  process.stdout.write('\x1b[1G')
}

function progress (current = lastCurrent, total = lastTotal, width = 5) {
  if (!columns) {
    return
  }
  const filled = Math.floor(width * current / total)
  const percent = Math.floor(100 * current / total)
  clean()
  process.stdout.write('Progress: [')
  process.stdout.write(filled.toString())
  process.stdout.write(''.padEnd(filled, '\u2588'))
  process.stdout.write(''.padEnd(width - filled, '\u2591'))
  process.stdout.write('] : ')
  process.stdout.write(percent.toString())
  process.stdout.write('%\n')
  process.stdout.write(ticks[++lastTick % ticks.length])
  process.stdout.write('testing...')
  lastCurrent = current
  lastTotal = total
}

function output (...params) {
  if (columns) {
    clean()
  }
  console.log(...params)
  if (columns) {
    process.stdout.write('\n')
    progress()
  }
}

let count = 0
setInterval(() => {
  progress(count, 10, 10)
  if (count === 1) {
    output({ a: 1 })
  } else if (count === 3) {
    output('first')
  } else if (count === 5) {
    output('second')
  }
  ++count
  if (count === 11) {
    process.exit(0)
  }
}, 250)
