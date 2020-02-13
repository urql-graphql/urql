---
'@urql/core': minor
---

Adds the `maskTypename` export to urql-core, this deeply masks typenames from the given payload.
Masking typenames has also become an option on the `client` under the name `maskTypename` setting this to `true` will automatically
strip typenames from results.
