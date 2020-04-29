---
'@urql/exchange-graphcache': patch
---

Fix traversal issue, where when a prior selection set has set a nested result field to `null`, a subsequent traversal of this field attempts to access `prevData` on `null`.
