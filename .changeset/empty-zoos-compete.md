---
'@urql/core': patch
---

Fix a condition under which the `Client` would hang when a query is started and consumed with `toPromise()`
