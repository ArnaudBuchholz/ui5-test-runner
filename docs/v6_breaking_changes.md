# version 6 breaking changes

> 🚧 work in progress

* Drop support of old Node.js versions
* Drop support of JSDOM
* Drop support of dynamic reporting (while running the tests)
* Drop support of experimental features (JEST, experimental coverage)
* No more caching of ui5 resources (--cache)
* Coverage and screenshots are OFF by default
* No screenshot for QUnit (only the failure one is taken)
* Screenshot on failure does not depend on screesnhot
* --report-generators is replaced with --end command
* --libs replaced with --lib (to be consistent with --url)
* --localhost removed (no more needed)