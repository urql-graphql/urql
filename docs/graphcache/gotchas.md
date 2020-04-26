---
title: Gotchas
order: 5
---

# Gotchas

When using this normalised cache there are a few out of the box features
we need to be aware of, being aware of these features will make it easier
to define best practices and to avoid pitfalls.

Most of the measures we'll cover are brought to life to ensure we can build out
to a fully offline normalised cache.

## Commutativity

By default the cache ensures idempotent and commutative results, the last part of this
is the most relevant one to be aware of.

Commutative guarantees mean that we'll keep the order of operations consistent, let's look
at an example to clear this up.
We are in our application and we queue up two queries, an `authorsQuery` and a `todosQuery`.

When we dispatch `todosQuery` first and `authorsQuery` later but the `authorsQuery` returns a result
before the `todosQuery` we'll put this result in a layer (this means it isn't actually in the real data)
until the `todosQuery` arrives. When the `todosQuery` arrives we'll commit that first and then the `authorsQuery`
to ensure our results are accurate. 

## Optimistic results & refetches

When we have mutations in-flight that have optimistic entries we defer refetches due to `cache-and-network` and
`partial` this ensures we don't put our data in an inconsistent state.

Let's look at an example, we have a list of an entity, we click delete on four of them and we use `optimistic` to
delete these before the network actually returns. This puts our UI in an inconsistent state since the list is `partial`
so it would trigger a refetch, if these mutations would be slow and the fetch would be quick this would make our UI jump
to prevent this, this fetch will be deferred until those four mutations complete.
