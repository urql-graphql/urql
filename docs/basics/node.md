---
title: Node
order: 3
---

## Getting started

Installing `@urql/core` is quick and no other packages are immediately necessary.

```sh
yarn add @urql/core graphql
# or
npm install --save @urql/core graphql
```

All framework bindings — meaning `urql`, `@urql/preact`, `@urql/svelte`, and `@urql/vue` — reexport
all exports of our `@urql/core` core library. This package contains the
[`Client`](../api/core.md#client), built-in exchanges, and other utilities that are shared between
all bindings.

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

### Reading on

There are some more utilities that `@urql/core` exports. [All of them are listed in the API docs for
it.](../api/core.md)

## Queries

## Mutations
