---
'@urql/exchange-graphcache': major
---

Add improved error awareness to Graphcache. When Graphcache now receives a `GraphQLError` (via a `CombinedError`) it checks whether the `GraphQLError`'s `path` matches up with `null` values in the `data`. Any `null` values that the write operation now sees in the data will be replaced with a "cache miss" value (i.e. `undefined`) when it has an associated error. This means that errored fields from your GraphQL API will be marked as uncached and won't be cached. Instead the client will now attempt a refetch of the data so that errors aren't preventing future refetches or with schema awareness it will attempt a refetch automatically. Additionally, the `updates` functions will now be able to check whether the current field has any errors associated with it with `info.error`.
