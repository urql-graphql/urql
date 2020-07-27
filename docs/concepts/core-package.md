---
title: Core Package
order: 2
---

# The Core Package

The `@urql/core` package contains `urql`'s `Client`, some common utilities, and some default
_Exchanges_. These are the shared, default parts of `urql` that we will be using no matter which
framework we're interacting with.

Therefore those are also the parts of `urql` that contain its most important logic — like the
[`Client`](../api/core.md#client) — and the package that we need to know about if we're either integrating `urql` with a new
framework, or if we're using the "raw" `Client` in Node.js.

## Background

The ["Philosophy"](./philosophy.md) page explains how `urql` solves some of problems encountered when different aspects
of having a GraphQL client handle declarative querying and being a central point of extensibility.

By extension there are three parts of `urql` you'll come in contact with when you add it to your
app:

- the framework integration that allows you to declaratively write queries and mutations in your
  preferred framework, which are currently the [`urql`](../api/urql.md) or
  [`@urql/preact`](../api/preact.md) packages
- the [`Client`](../api/core.md#client) that manages the operation lifecycle and results
- and, exchanges that may either be some default exchanges or some from external packages

On this page we'll learn about the latter two points - shared logic that isn't specific to
a particular library or framework (such as React or Preact code).

_Exchanges_ are discussed in more detail on the [next page](./exchanges.md).

## Usage with Node.js

The largest part of `urql` itself and the core package is the aforementioned `Client`. It's often
used directly when using `urql` in Node.js without any other integration.

We've previously seen how we can use the `Client`'s stream methods directly, in [Stream
Patterns](./stream-patterns.md). However, the [`Client`](../api/core.md#client) also has plenty of
convenience methods that make interacting with the `Client` directly a lot easier.

### One-off Queries and Mutations

When you're using `urql` to send one-off queries or mutations — rather than in full framework code,
where updates are important — it's common to convert the streams that we get to promises. The
`client.query` and `client.mutation` methods have a shortcut to do just that.

```js
const QUERY = `
  query Test($id: ID!) {
    getUser(id: $id) {
      id
      name
    }
  }
`;

client
  .query(QUERY, { id: 'test' })
  .toPromise()
  .then(result => {
    console.log(result); // { data: ... }
  });
```

This may be useful when we don't plan on cancelling queries or we don't care about future updates to
this data and are just looking to query a result once.

Similarly there's a way to read data from the cache synchronously, provided that the cache has
received a result for a given query before. The `Client` has a `readQuery` method which is a
shortcut for just that.

```js
const QUERY = `
  query Test($id: ID!) {
    getUser(id: $id) {
      id
      name
    }
  }
`;

const result = client.readQuery(QUERY, { id: 'test' });

result; // null or { data: ... }
```

Since the streams in `urql` operate synchronously, internally this method subscribes to
`client.executeQuery` and unsubscribes immediately. If a result is available in the cache it will be
resolved synchronously prior to the unsubscribe. If not, the query is cancelled and no request will be sent to the GraphQL API.

## Common Utilities in Core

The `@urql/core` package contains other utilities that are shared between multiple addon packages.
This is a short but non-exhaustive list. It contains,

- [`CombinedError`](../api/core.md#combinederror) - our abstraction to combine one or more `GraphQLError`(s) and a `NetworkError`
- `makeResult` and `makeErrorResult` - utilities to create _Operation Results_
- [`createRequest`](../api/core.md#createrequest) - a utility function to create a request from a query and some variables (which
  generates a stable _Operation Key_)

There are other utilities not mentioned here. Read more about the `@urql/core` API in the [API docs](../api/core.md).
