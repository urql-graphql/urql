---
'@urql/exchange-graphcache': patch
---

Type the `relayPagination` and `simplePagination` helpers return value as `Resolver<any, any, any>` as there's no way to match them consistently to either generated or non-generated resolver types anymore.
