let lastCurrent
let lastTotal

const columns = process.stdout.columns

if (columns) {
  process.stdout.write('\n')
}

function clean () {
  process.stdout.write('\x1b[1F')
  process.stdout.write(''.padEnd(columns - 10, '\u2591'))
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
  progress(count, 5)
  if (count === 1) {
    output({ a: 1 })
  } else if (count === 3) {
    output('first')
  } else if (count === 5) {
    output('second')
  }
  ++count
  if (count === 6) {
    process.exit(0)
  }
}, 250)
