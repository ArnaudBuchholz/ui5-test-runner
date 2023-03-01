# Configuration file

It is also possible to preset parameters by creating a JSON file named `ui5-test-runner.json` where the **runner is executed** *(i.e. `process.cwd()`)*.

> The property names match the [option names](usage.md), converted to [lowerCamelCase](https://wiki.c2.com/?LowerCamelCase).
> Files written for v1 may **not** by compatible with v2, check [mapping](mapping_v1_v2.md).


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