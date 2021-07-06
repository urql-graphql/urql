---
'@urql/core': patch
---

Prevent `ssrExchange().restoreData()` from adding results to the exchange that have already been invalidated. This may happen when `restoreData()` is called repeatedly, e.g. per page. When a prior run has already invalidated an SSR result then the result is 'migrated' to the user's `cacheExchange`, which means that `restoreData()` should never attempt to re-add it again.
