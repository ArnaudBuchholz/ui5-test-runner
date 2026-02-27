Accepted values for boolean option are :
* true: `true`, `'true'`, `'on'`, `1`
* false : `false`, `'false'`, `'off'`, `0`

A boolean option is usually `false` by default, just using the option without value sets it to `true`.
For instance, when using [[failFast]] :
`ui5-test-runner --fail-fast`

would result in `failFast` to be `true`
