---
title: Errors
order: 6
---

# Error handling

When we use a GraphQL API there are two kinds of errors we may encounter: Network Errors and GraphQL
Errors from the API. Since it's common to encounter either of them, there's a
[`CombinedError`](../api/core.md#combinederror-class) class that can hold and abstract either.

We may encounter a `CombinedError` when using `urql` wherever an `error` may be returned, typically
in results from the API. The `CombinedError` can have one of two properties that describe what went
wrong.

- The `networkError` property will contain any error that stopped `urql` from making a network
  request.
- The `graphQLErrors` property may be an array that contains [normalized `GraphQLError`s as they
  were received in the `errors` array from a GraphQL API.](https://graphql.org/graphql-js/error/)

Additionally, the `message` of the error will be generated and combined from the errors for
debugging purposes.

![Combined errors](../assets/urql-combined-error.png)

It's worth noting that an `error` can coexist and be returned in a successful request alongside
`data`. This is because in GraphQL a query can have partially failed but still contain some data.
In that case `CombinedError` will be passed to us with `graphQLErrors`, while `data` may still be
set.
