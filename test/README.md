# Testing chromium command line

* Install REserve globally `npm install -g reserve`
* Start REserve with `reserve --silent`

## timeout

The goal of this test is to check the granulary of timeouts.

`node defaults/chromium http://localhost:8080/timeout.html?timeout`
`node defaults/chromium http://localhost:8080/timeout.html?interval`

Traces will appear showing how regular the timeout is executed.

## localStorage

`node defaults/chromium http://localhost:8080/localStorage.html?1`
`node defaults/chromium http://localhost:8080/localStorage.html?2`

Traces will show the values of localStorage for each window.
