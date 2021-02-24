---
title: Under the hood
order: 5
---

# Under the hood

Graphcache has a couple of hidden features behind the scenes, that handle how it deals with certain edge cases.
Being aware of these features and edge cases makes it easier to define best practices and to avoid pitfalls.

Most of these hidden features and mechanisms in this section exist to ensure consistent behavior for Graphcache's (future) offline and persistence features.

## Commutativity

By default the cache ensures that results from the API are applied commutatively.

Commutativity is a guarantee that means that Graphcache will attempt to keep the order of cache changes consistent, when results arrive out-of-order from the API, for instance due to network latency. When a query is dispatched first and another second, their results can still arrive in reverse, but Graphcache will still make sure that the cache results are applied in order, as if the results arrived in the right order.
Let's look at an example to understand this.
Suppose our application queues up two queries, an `authorsQuery` and a `todosQuery`.

We dispatch the `todosQuery` first and the `authorsQuery` later, but because of network latency the `authorsQuery`'s result arrived before the `todosQuery`'s result.
The cache will put the out-of-order result from the `authorsQuery` onto a layer until the other result arrives.
This layer contains the out-of-order result's data, but hasn't been committed yet to the permanent in-memory data.
When the `todosQuery` does arrive and all out-of-order results have been stored on layers, the cache will start committing in order to ensure the actual data is consistent.
This layering approach means that Graphcache is able to temporarily reorder results as they arrive, ensuring that the results don't overwrite each other in a random order.

## Optimistic results & refetches

We've previously learned about [how to create "Optimistic Updates" in an earlier section.](./cache-updates.md#optimistic-updates)
Optimistic updates can temporarily update cached data after incoming mutations, which will trigger on screen queries to update.
However, if we also use [the `cache-and-network` request policy](../concepts/document-caching.md#request-policies) at the same time, some queries can refetch and overwrite our optimistic data,
causing an unintended state where the intended optimistic update is destroyed.
Such an unintended refetch can also happen if after an optimistic update a query is refetched when it’s not or
only partially available in the cache.

To prevent this, Graphcache will temporarily pause refetches that may overwrite optimistic updates.
Once all mutations with optimistic updates complete however, all results will be applied at once,
and refetched that may update the mutation data will be rerun.

Let's look at an example. Suppose our app has a list of entities (for instance `Todo`s).
We've written an optimistic update so that when the user deletes an item from the list, we make it disappear immediately.
Usually, if the list is using a query with `cache-and-network`, this means that the optimistic update would automatically trigger a refetch of the list, which would make the deleted item reappear, although it shouldn't.

To prevent this, Graphcache waits for the mutation to complete instead, as it detects that the query overlaps with the optimistic update, and retriggers the refetch only when all mutations have completed.
