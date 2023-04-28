---
'@urql/exchange-graphcache': patch
---

Fix missing cache updates, when a query that was previously torn down restarts and retrieves results from the cache. In this case a regression caused cache updates to not be correctly applied to the queried results, since the operation wouldn’t be recognised properly
