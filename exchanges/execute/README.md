<h2 align="center">@urql/exchange-execute</h2>

<p align="center"><strong>An exchange for executing queries against a local schema in <code>urql</code></strong></p>

`@urql/exchange-execute` is an exchange for the [`urql`](https://github.com/FormidableLabs/urql) GraphQL client which executes queries against a local schema.
This is a replacement for the default _fetchExchange_ which sends queries over HTTP/S to be executed remotely.

## Quick Start Guide

First install `@urql/exchange-execute` alongside `urql`:

```sh
yarn add @urql/exchange-execute
# or
npm install --save @urql/exchange-execute
```

You'll then need to add the `executeExchange`, that this package exposes, to your `urql` Client,
by replacing the default fetch exchange with it:

```js
import { createClient, dedupExchange, cacheExchange } from 'urql';
import { executeExchange } from '@urql/exchange-execute';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange,
    // Replace the default fetchExchange with the new one.
    executeExchange({
      /* config */
    }),
  ],
});
```

## Usage

The exchange takes the same arguments as the [_execute_ function](https://graphql.org/graphql-js/execution/#execute) provided by graphql-js.

Here's a brief example of how it might be used:

```js
import { buildSchema } from 'graphql';

// Create local schema
const schema = buildSchema(`
  type Todo {
    id: ID!
    text: String!
  }

  type Query {
    todos: [Todo]!
  }

  type Mutation {
    addTodo(text: String!): Todo!
  }
`);

// Create local state
let todos = [];

// Create root value with resolvers
const rootValue = {
  todos: () => todos,
  addTodo: (_, args) => {
    const todo = { id: todos.length.toString(), ...args };
    todos = [...todos, todo];
    return todo;
  }
}

// ...

// Pass schema and root value to executeExchange
executeExchange({
  schema,
  rootValue,
}),
// ...
```

## Maintenance Status

**Active:** Formidable is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.
