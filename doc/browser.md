# Browser instantiation command

## probing

## executing

### screenshot

## Building a custom browser instantiation command

* You may follow the pattern being used by [`pupepeteer.js`](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/main/defaults/pupepeteer.js)

* The command accepts only one parameter
* When the command is invoked with `capabilities` : it should dump the list of capabilities and stop. The expected result is a valid JSON that must be written on the standard output.
  The expected members are :
  - `modules` *(optional, array of strings, default is `[]`)* : the list of NPM modules the command dynamically depends on (see below).
  - `screenshot` *(optional, boolean, default is `false`)* : does the command support the `screenshot` message.
  - `console` *(optional, boolean, default is `false`)* : does the command support saving the console output.
  - `scripts` *(optional, boolean, default is `false`)* : does the command support scripts injection.

For instance : 
```json
{
  "modules": ["puppeteer"],
  "screenshot": true,
  "console": true,
  "scripts": true
}
```

* Otherwise the command is invoked with a path to a JSON file : it must load the settings and start the browser accordingly.
  The expected JSON syntax includes :
  

* During execution, the child process will receive messages that must be handled appropriately :
  - `message.command === 'stop'` : the browser must be closed and the command line must exit
  - `message.command === 'screenshot'` : should generate a screenshot (the message contains a `filename` member with an absolute path). To indicate that the screenshot is done, the command line must send back the same message (`process.send(message)`).
* It is **mandatory** to ensure that the child process explicitly exits at some point *(see this [thread](https://github.com/nodejs/node-v0.x-archive/issues/2605) explaining the fork behavior with Node.js)*
