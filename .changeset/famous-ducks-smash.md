---
'@urql/exchange-graphcache': patch
---

Update the `updater` function type of `cache.updateQuery` to have a return type of `DataFields` so that `__typename` does not need to be defined.
