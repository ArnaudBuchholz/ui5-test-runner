### Configuration file

> Insist on the fact that the property names match the option names, it is true for v1 as well as v2

It is also possible to set these parameters by creating a JSON file named `ui5-test-runner.json` where the **runner is executed** *(i.e. `process.cwd()`)*.

The file is applied **before** parsing the command line parameters, hence some parameters might be **overridden**.

If you want the parameters to be **forced** *(and not be overridden by the command line)*, prefix the parameter name with `!`.

For example :
```json
{
  "!pageTimeout": 900000,
  "globalTimeout": 3600000,
  "failFast": true
}
```

> The `pageTimeout` setting cannot be overridden by the command line parameters

**NOTE** : the `libs` parameters must be converted to an array of pairs associating `relative` URL and `source` path.

For instance :

```json
{
  "libs": [{
    "relative": "my/namespace/feature/lib/",
    "source": "../my.namespace.feature.project.lib/src/my/namespace/feature/lib/"
  }]
}
```

> Structure of the `libs` parameter