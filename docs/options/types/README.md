This folder documents the value types an option can take (`string`, `integer`, `boolean`, `enumeration`, `fs-entry`, `regexp`, `timeout`, `json`, `percent`, `url`, `library-mapping`, …). Each `<type>.md` describes one type.

## Structure

Every type document follows the same shape:

1. **Frontmatter** — `"#type": concept`, a `title` of the form `<type> type`, a one-line `summary`, and a short list of `keywords`.
2. **A one-sentence definition** as the opening line of the body.
3. **A `## Syntax` section** describing the accepted forms and any validation rules. If the type supports modifiers, list them here as links to `./modifiers/<name>.md`.
4. **A `## Example` section** showing at least one real option that uses the type, with a concrete command line.

## Guidelines

* Ground every statement in the validator (`src/configuration/validators/`) and in real options (`src/configuration/options.ts`) — do not describe forms the code does not accept.
* Examples must reference options that actually use the type, linked as `[`option`](../option.md)`, and use their real CLI flags.
* Describe only the forms a user can provide on the command line or in a configuration file. Internal-only forms (for instance a `RegExp` object the validator accepts but that cannot be written in JSON) do not belong in the syntax.
* Keep the singular heading `## Example` even when listing several examples.
