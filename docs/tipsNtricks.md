## Tips & tricks

* The runner takes a screenshot for **every** OPA assertion (`Opa5.assert.ok`)

* To benefit from **parallelization**, split the OPA test pages per journey.<br> An example pattern :
  - **Declare** the list of journeys in a json file : [`AllJourneys.json`](https://github.com/ArnaudBuchholz/training-ui5con18-opa/blob/main/webapp/test/integration/AllJourneys.json)
  - **Enumerate** `AllJourneys.json` in [`testsuite.qunit.html`](https://github.com/ArnaudBuchholz/training-ui5con18-opa/blob/main/webapp/test/testsuite.qunit.html#L16) to declare as many pages as journeys
  - **Modify** [`AllJourneys.js`](https://github.com/ArnaudBuchholz/training-ui5con18-opa/blob/main/webapp/test/integration/init.js#L22) to support a `journey=` parameter and list all declared journeys

