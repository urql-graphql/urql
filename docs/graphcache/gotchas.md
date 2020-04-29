---
title: Gotchas
order: 5
---

# Gotchas

Graphcache has a couple of hidden features behind the scenes, that handle how it deals with certain edge cases.
Being aware of these features and edge cases makes it easier to define best practices and to avoid pitfalls.

Most of these hidden features and mechanisms in this section exist to ensure consistent behavior for Graphcache's (future) offline and persistence features.

## Commutativity

By default the cache ensures idempotent and commutative results, the last part of this
is the most relevant one to be aware of.

Commutative guarantees means that the cache will keep the order of operations consistent, let's look
at an example to clear this up.
We are in our application and we queue up two queries, an `authorsQuery` and a `todosQuery`.

We dispatch the `todosQuery` first and the `authorsQuery` later, the `authorsQuery` returns a result
before the `todosQuery`. The cache will put this result from the `authorsQuery` in a
layer (this means it isn't actually in the real data) until the `todosQuery` arrives.
When the `todosQuery` does arrive. The cache will commit the data from the `todosQuery` first and
then the data from the `authorsQuery` to ensure the actual data is consistent.

## Optimistic results & refetches

Optimistic updates can temporarily update the data after incoming mutations, which will trigger on screen queries to update.
However, if we also use [the `cache-and-network` request policy](../basics/queries.md#request-policies) at the same time, some queries can refetch and overwrite our optimistic data,
causing an unintended state where the intended optimistic update is destroyed.
Such an unintended refetch can also happen if after an optimistic update a query is refetched when it’s not or
only partially available in the cache.

To prevent this, Graphcache will temporarily pause refetches that may overwrite optimistic updates.
Once all mutations with optimistic updates complete however, all results will be applied at once,
and refetched that may update the mutation data will be rerun.

Let's look at an example, the has a list of an entity (for instance `Todos`), we click delete on four of them and we use `optimistic` to
delete these before the network-request actually returns. This puts our UI in an inconsistent state since the list is `partial`
so it would trigger a refetch, if these mutations would be slow and the fetch would be quick this would make our UI jump
to prevent this, this fetch will be deferred until those four mutations complete.
