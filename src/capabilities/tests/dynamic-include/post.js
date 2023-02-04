const xhr = new XMLHttpRequest()
xhr.open('POST', '/_/log')
xhr.send('{"test":' + window.test + '}')
