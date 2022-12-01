---
'@urql/core': patch
---

Reuse output of `stringifyDocument` in place of repeated `print`. This will mean that we now prevent calling `print` repeatedly for identical operations and are instead only reusing the result once.

This change has a subtle consequence of our internals. Operation keys will change due to this
refactor and we will no longer sanitise strip newlines from queries that `@urql/core` has printed.
