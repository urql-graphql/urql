---
title: Document Caching
order: 3
---

# Document Caching

By default `urql` uses a concept called _Document Caching_. It will avoid sending the same requests
to a GraphQL API repeatedly by caching the result of each query.

This works like the cache in a browser. `urql` creates a key for each request that is sent based on
a query and its variables.

The default _document caching_ logic is implemented in the default `cacheExchange`. We'll learn more
about ["Exchanges" on a later page.](../concepts/exchanges.md)

## Operation Keys

![Keys for GraphQL Requests](../assets/urql-operation-keys.png)

Once a result comes in it's cached indefinitely by its key. This means that each unique request
can have exactly one cached result.

However, we also need to invalidate the cached results so that requests are sent again and updated,
when we know that some results are out-of-date. With document caching we assume that a result may
be invalidated by a mutation that executes on data that has been queried previously.

In GraphQL the client can request additional type information by adding the `__typename` field to a
query's _selection set_. This field returns the name of the type for an object in the results, and
we use it to detect commonalities and data dependencies between queries and mutations.

![Document Caching](../assets/urql-document-caching.png)

In short, when we send a mutation that contains types that another query's results contains as well,
that query's result is removed from the cache.

This is an aggressive form of cache invalidation. However, it works well for content-driven sites,
while it doesn't deal with normalized data or IDs.

## Request Policies

[We previously covered request policies on the "Queries" page.](./queries.md)

The _request policy_ that is defined will alter what the default document cache does. By default the
cache will prefer cached results and will otherwise send a request, which is called `cache-first`,
but there's also `cache-and-network`, `cache-only`, and `network-only`.

[Read more about which request policies are available in the API
docs.](../api/core.md#requestpolicy-type)

## Document Cache Gotchas

This cache has a small trade-off! If we request a list of data and the API returns an empty list,
the cache won't be able to see the `__typename` of said list and won't invalidate.

Once you've encountered this problem you've likely hit the limits of the _Document Caching_
approach, and you may want to [switch to "Normalized Caching"
instead.](../graphcache/normalized-caching.md)
