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

**NOTE** : Feature disabling parameters (for instance : `--no-screenshot`, `--no-coverage`) are not accepting any value and the configuration file value is ignored.

The following properties are equivalent :

```json
{
  "noCoverage": true,
  "noCoverage": false,
  "noCoverage": null
}
```

> Properties are equivalent to `--no-coverage`

**NOTE** : The parameters accepting multiple values (denoted with ... as in `'--libs <lib...>`) may be converted to an array of values in the configuration file.

For instance, `libs` parameter can be :

```json
{
  "libs": "my/namespace/lib/=../my.namespace.lib/src/my/namespace/lib/"
}
```

> Structure of the `libs` parameter when only one value is specified

```json
{
  "libs": [
    "my/namespace/lib/=../my.namespace.lib/src/my/namespace/lib/",
    "my/namespace/lib2/=../my.namespace.lib2/src/my/namespace/lib2/"
  ]
}
```

> Structure of the `libs` parameter when multiple values are specified
