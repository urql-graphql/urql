---
title: Auto-populate Mutations
order: 8
---

# Automatically populating Mutations

The `populateExchange` allows you to auto-populate selection sets in your mutations using the
`@populate` directive. In combination with [Graphcache](../graphcache/README.md) this is a useful
tool to update the data in your application automatically following a mutation, when your app grows
and it becomes harder to track all fields that have been queried before.

> **NOTE:** The `populateExchange` is currently _experimental_! Certain patterns and usage paths
> like GraphQL field arguments aren't covered yet, and the exchange hasn't been extensively used
> yet.

## Installation and Setup

The `populateExchange` can be installed via the `@urql/exchange-populate` package.

```sh
yarn add @urql/exchange-populate
# or
npm install --save @urql/exchange-populate
```

Afterwards we can set the `populateExchange` up by adding it to our list of `exchanges` in the
client options.

```ts
import { createClient, dedupExchange, fetchExchange } from '@urql/core';
import { populateExchange } from '@urql/exchange-populate';

const client = createClient({
  // ...
  exchanges: [dedupExchange, populateExchange({ schema }), cacheExchange, fetchExchange],
});
```

The `populateExchange` should be placed in front of the `cacheExchange`, especially if you're using
[Graphcache](../graphcache/README.md), since it won't understand the `@populate` directive on its
own. It should also be placed after the `dedupExchange` to avoid unnecessary work.

Adding the `populateExchange` now enables us to use the `@populate` directive in our mutations.

The `schema` option is the introspection result for your backend graphql schema, more information
about how to get your schema can be found [in the "Schema Awareness" Page of the Graphcache documentation.](../graphcache/schema-awareness.md#getting-your-schema).

## Example usage

Consider the following queries which have been requested in other parts of your application:

```graphql
# Query 1
{
  todos {
    id
    name
  }
}

# Query 2
{
  todos {
    id
    createdAt
  }
}
```

Without the `populateExchange` you may write a mutation like the following which returns a newly created todo item:

```graphql
# Without populate
mutation addTodo(id: ID!) {
  addTodo(id: $id) {
    id        # To update Query 1 & 2
    name      # To update Query 1
    createdAt # To update Query 2
  }
}
```

By using `populateExchange`, you no longer need to manually specify the selection set required to update your other queries. Instead you can just add the `@populate` directive.

```graphql
# With populate
mutation addTodo(id: ID!) {
  addTodo(id: $id) @populate
}
```

### Choosing when to populate

You may not want to populate your whole mutation response. In order to reduce your payload, pass populate lower in your query.

```graphql
mutation addTodo(id: ID!) {
  addTodo(id: $id) {
    id
    user @populate
  }
}
```

### Using aliases

If you find yourself using multiple queries with variables, it may be necessary to
[use aliases](https://graphql.org/learn/queries/#aliases) in order to allow merging of queries.

> **Note:** This caveat may change in the future or this restriction may be lifted.

**Invalid usage**

```graphql
# Query 1
{
  todos(first: 10) {
    id
    name
  }
}

# Query 2
{
  todos(last: 20) {
    id
    createdAt
  }
}
```

**Usage with aliases**

```graphql
# Query 1
{
  firstTodos: todos(first: 10) {
    id
    name
  }
}

# Query 2
{
  lastTodos: todos(last: 20) {
    id
    createdAt
  }
}
```
