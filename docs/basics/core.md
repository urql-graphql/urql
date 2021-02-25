---
title: Core Usage
order: 3
---

# Core

The `@urql/core` package contains `urql`'s `Client`, some common utilities, and some default
_Exchanges_. These are the shared, default parts of `urql` that we will be using no matter which
framework we're interacting with.

All framework bindings — meaning `urql`, `@urql/preact`, `@urql/svelte`, and `@urql/vue` — reexport
all exports of our `@urql/core` core library. This means that if we want to use `urql`'s `Client`
imperatively or with Node.js we'd use `@urql/core`'s utilities or the `Client` directly.

## Getting started

Installing `@urql/core` is quick and no other packages are immediately necessary.

```sh
yarn add @urql/core graphql
# or
npm install --save @urql/core graphql
```

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

### gql

A notable utility function is the `gql` tagged template literal function, which is a drop-in
replacement for `graphql-tag`, if you're coming from other GraphQL clients.

Wherever `urql` accepts a query document, you may either pass a string or a `DocumentNode`. `gql` is
a utility that allows a `DocumentNode` to be created directly, and others to be interpolated into
it, which is useful for fragments for instance. This function will often also mark GraphQL documents
for syntax highlighting in most code editors.

In most examples we may have passed a string to define a query document, like so:

```js
const TodosQuery = `
  query {
    todos {
      id
      title
    }
  }
`;
```

We may also use the `gql` tag function to create a `DocumentNode` directly:

```js
import { gql } from '@urql/core';

const TodosQuery = gql`
  query {
    todos {
      id
      title
    }
  }
`;
```

Since all framework bindings also re-export `@urql/core`, we may also import `gql` from `'urql'`,
`'@urql/svelte'` and other bindings directly.

We can also start interpolating other documents into the tag function. This is useful to compose
fragment documents into a larger query, since it's common to define fragments across components of
an app to spread out data dependencies. If we accidentally use a duplicate fragment name in a
document, `gql` will log a warning, since GraphQL APIs won't accept duplicate names.

```js
import { gql } from '@urql/core';

const TodoFragment = gql`
  fragment SmallTodo on Todo {
    id
    title
  }
`;

const TodosQuery = gql`
  query {
    todos {
      ...TodoFragment
    }
  }

  ${TodoFragment}
`;
```

## Common Utilities in Core

The `@urql/core` package contains other utilities that are shared between multiple addon packages.
This is a short but non-exhaustive list. It contains,

- [`CombinedError`](../api/core.md#combinederror) - our abstraction to combine one or more `GraphQLError`(s) and a `NetworkError`
- `makeResult` and `makeErrorResult` - utilities to create _Operation Results_
- [`createRequest`](../api/core.md#createrequest) - a utility function to create a request from a query and some variables (which
  generates a stable _Operation Key_)

There are other utilities not mentioned here. Read more about the `@urql/core` API in the [API docs](../api/core.md).

## Reading on

This concludes the introduction for using `@urql/core` without any framework bindings. This showed
just a couple of ways to use `gql` or the `Client`, however you may also want to learn more about
[how to use `urql`'s streams](../architecture.md#stream-patterns-in-urql). Furthermore, apart from the framework
binding introductions, there are some other pages that provide more information on how to get fully
set up with `urql`:

- [How does the default "document cache" work?](./document-caching.md)
- [How are errors handled and represented?](./errors.md)
- [A quick overview of `urql`'s architecture and structure.](../architecture.md)
- [Setting up other features, like authentication, uploads, or persisted queries.](../advanced/README.md)
