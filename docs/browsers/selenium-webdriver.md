# selenium-webdriver

## Capabilities

| `--browser` | `$/selenium-webdriver.js` |
|---|---|
| Module | [selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver) |
| Screenshots | ✔️ `.png` |
| Scripts | ❓ *depends on the browser* |
| Traces | ❓ *depends on the browser* |

Browser selection is done by passing browser parameters. For instance :

`ui5-test-runner --browser $/selenium-webdriver.js -- --browser firefox`

Supported browsers :

* chrome
* firefox
* edge

## Options

```text
  -b, --browser <name>   Browser driver (default: "chrome")
  --visible [flag]       Show the browser (default: false)
  -s, --server <server>  Selenium server URL
  --binary <binary>      Binary path
  -u, --unsecure         Disable security features (default: false)
```

## Implementation notes

Please check https://www.npmjs.com/package/selenium-webdriver#installation for installing browser driver.

Unfortunately, the capabilities depend on the selected browser. Usually, `chrome` is the one with the most features.

## Running a selenium server within docker

To utilize Docker images for hosting the Selenium server, it is recommended to set up a host mapping to facilitate communication between the Docker container and the internal server of the UI5 test runner.

For example, you can use the hostname `myhost`:

1. Start the Docker container with the following command:

```bash
docker run -d -p 4444:4444 --add-host myhost:host-gateway --name selenium-chrome selenium/standalone-chrome:latest`
```

2. Execute the test runner using the `--localhost` option as shown below:

```bash
ui5-test-runner --localhost myhost --browser $/selenium-webdriver.js --browser chrome -s http://localhost:4444/wd/hub
```
