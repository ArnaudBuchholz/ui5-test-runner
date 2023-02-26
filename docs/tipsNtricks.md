## Tips & tricks

* The runner takes a screenshot for **every** OPA assertion (`Opa5.assert.ok`)
* To benefit from **parallelization**, split the OPA test pages per journey.<br> An example pattern :
  - **Declare** the list of journeys in a json file : [`AllJourneys.json`](https://github.com/ArnaudBuchholz/training-ui5con18-opa/blob/master/webapp/test/integration/AllJourneys.json)
  - **Enumerate** `AllJourneys.json` in [`testsuite.qunit.html`](https://github.com/ArnaudBuchholz/training-ui5con18-opa/blob/master/webapp/test/testsuite.qunit.html#L17) to declare as many pages as journeys
  - **Modify** [`AllJourneys.js`](https://github.com/ArnaudBuchholz/training-ui5con18-opa/blob/master/webapp/test/integration/AllJourneys.js#L26) to support a `journey=` parameter and list all declared journeys

