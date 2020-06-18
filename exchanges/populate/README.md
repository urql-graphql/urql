# @urql/exchange-populate

`populate` is an exchange for auto-populating fields in your mutations.

[Read more about the `populateExchange` on our docs!](https://formidable.com/open-source/urql/docs/advanced/auto-populate-mutations)

## Quick Start Guide

First install `@urql/exchange-populate` alongside `urql`:

```sh
yarn add @urql/exchange-populate
# or
npm install --save @urql/exchange-populate
```

You'll then need to add the `populateExchange`, that this package exposes.

```js
import { createClient, dedupExchange, cacheExchange, fetchExchange } from 'urql';
import { populateExchange } from '@urql/exchange-populate';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [dedupExchange, populateExchange({ schema }), cacheExchange, fetchExchange],
});
```

The `schema` option is the introspection result for your backend graphql schema, more information
about how to get your schema can be found [in the "Schema Awareness" Page of the Graphcache documentation.](https://formidable.com/open-source/urql/docs/graphcache/schema-awareness/#getting-your-schema).

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

> Note: The above two mutations produce an identical GraphQL request.
