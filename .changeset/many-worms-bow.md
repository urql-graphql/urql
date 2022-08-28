---
'@urql/core': patch
---

Fix case where `maskTypename` would not traverse down when the root query-field does not contain a `__typename`
