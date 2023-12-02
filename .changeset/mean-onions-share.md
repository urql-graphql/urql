---
'@urql/exchange-graphcache': minor
---

Allow the user to debug cache-misses by means of the new `logger` interface on the `cacheExchange`. A field miss will dispatch a `debug` log when it's not marked with `@_optional` or when it's non-nullable in the `schema`.
