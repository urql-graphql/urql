---
'@urql/core': minor
---

Adds the `maskTypename` export to urql-core, this deeply masks typenames from the given payload.
Masking `__typename` properties is also available as a `maskTypename` option on the `Client`. Setting this to true will
strip typenames from results.
