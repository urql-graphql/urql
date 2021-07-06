---
'@urql/core': patch
---

Fix accidental change in passive `stale: true`, where a `cache-first` operation issued by Graphcache wouldn't yield an affected query and update its result to reflect the loading state with `stale: true`. This is a regression from `v2.1.0` and mostly becomes unexpected when `cache.invalidate(...)` is used.
