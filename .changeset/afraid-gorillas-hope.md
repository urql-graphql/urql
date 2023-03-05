---
'@urql/exchange-graphcache': patch
---

Fix regression which caused partial results, whose refetches were blocked by the looping protection, to not have a `stale: true` flag added to them. This is a regression from https://github.com/urql-graphql/urql/pull/2831 and only applies to `cacheExchange`s that had the `schema` option set.
