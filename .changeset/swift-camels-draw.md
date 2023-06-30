---
'@urql/core': patch
---

Add deprecation notice for `maskTypename` option.
Masking typenames in a result is no longer recommended. It’s only
useful when multiple pre-conditions are applied and inferior to
mapping to an input object manually.
