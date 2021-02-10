---
'@urql/exchange-graphcache': minor
---

Allow `schema` option to be passed with a partial introspection result that only contains `queryType`, `mutationType`, and `subscriptionType` with their respective names. This allows you to pass `{ __schema: { queryType: { name: 'Query' } } }` and the likes to Graphcache's `cacheExchange` to alter the default root names without enabling full schema awareness.
