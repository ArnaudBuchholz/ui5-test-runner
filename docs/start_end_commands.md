---
"#type": task
title: Run commands around a test run
summary: How to start a server before tests and run a teardown command afterwards
keywords:
  - start
  - end
  - setup
  - teardown
  - lifecycle
  - server
relations:
  requires:
    - options/start
    - options/end
  see-also:
    - options/startWaitUrl
    - options/startWaitMethod
    - options/startTimeout
    - options/endTimeout
    - modes/remote
---
# Run commands around a test run

`ui5-test-runner` can execute a command before the tests begin and another after
they finish. This is typically used to bring up the application server the tests
talk to in [remote mode](./modes/remote.md), then shut it down.

## Starting a command before the tests

[`--start`](./options/start.md) runs a command before any page is tested. The
process is spawned in the configured working directory and left running for the
duration of the run.

If the command starts a server that needs time to become ready, pair it with
[`--start-wait-url`](./options/startWaitUrl.md): the runner polls that URL until
it responds before starting the tests.

- [`--start-wait-method`](./options/startWaitMethod.md) sets the HTTP method used
  while polling (default `GET`).
- [`--start-timeout`](./options/startTimeout.md) caps how long the runner waits
  for the URL to become reachable (default 30000 ms). Exceeding it fails the run.

When `--start-wait-url` is not given, the runner starts the command and proceeds
immediately without waiting.

## Running a command after the tests

[`--end`](./options/end.md) runs a command once all tests have completed, whatever
the outcome. Use it to stop the server or clean up.
[`--end-timeout`](./options/endTimeout.md) caps how long the runner waits for the
end command to finish.

## Example

```bash
ui5-test-runner \
  --start "npm run serve" \
  --start-wait-url http://localhost:8080 \
  --url http://localhost:8080/test/testsuite.qunit.html \
  --end "npm run stop"
```

This starts the application server, waits until it answers on port 8080, runs the
tests against it, then stops the server.
