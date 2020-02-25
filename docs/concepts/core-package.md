---
title: Core Package
order: 2
---

# The Core Package

Previously, [the "Philosophy" page](./philosophy.md) explained how `urql` solves different aspects
of having a GraphQL client handle declarative querying and being a central point of extensibiliy.

By extension there are three parts of `urql` you'll come in contact with when you add it to your
app:

<!-- TODO: Add more package links -->

- the framework integration that allows you to declaratively write queries and mutations in your
  preferred framework, which are currently the `urql` or `@urql/preact` packages
- the `Client` that manages the operation lifecycle and results
- and, exchanges that may either be some default exchanges or some from external packages

On this page we'll learn about the latter two points, which is shared logic that isn't specific to
any framework, like React or Preact code.

[We'll learn more about _Exchanges_ on the next page.](./exchanges.md)

## Contents of Core

The `@urql/core` package contains `urql`'s `Client`, some common utilities, and some default
_Exchanges_. These are the shared, default parts of `urql` that we will be using no matter which
framework we're interacting with.

Therefore those are also the parts of `urql` that contain its most important logic — like the
`Client` — and the package that we need to know about if we're either integrating `urql` with a new
framework, or if we're using the "raw" `Client` in Node.js.

## Usage with Node.js

The largest part of `urql` itself and the core package is the aforementioned `Client`. It's often
used directly if you're just using `urql` in Node.js without any other integration.

[We've previously seen how we can use the `Client`'s stream methods directly, in "Stream
Patterns".](./stream-patterns.md) However, the `Client` also has plenty of convenience methods that
make interacting with the `Client` directly a lot easier.

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

client.query(QUERY, { id: 'test' })
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
`client.executeQuery` but unsubscribes immediately. If a result is available in the cache it will be
resolved synchronosuly before we immediately unsubscribe, otherwise this will cause no request to be
sent to the GraphQL API.

## Common Utilities in Core

The `@urql/core` package contains other utilities that are shared between multiple addon packages.
This is a short but non-exhaustive list. It contains,

<!-- TODO: Add links to other docs pages where appropriate -->

- `CombinedError`, our abstraction to combine `GraphQLError`s and a `NetworkError`
- `makeResult` and `makeErrorResult`, utilities to create _Operation Results_
- `createRequest`, a utility function to create a request from a query and some variables (which
  generates a stable _Operation Key_)

There are more utilities. [Read more about the `@urql/core` API in the API docs for
it.](../api/core.md)
