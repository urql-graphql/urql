---
title: '@urql/exchange-execute'
order: 5
---

# Execute Exchange

The `@urql/exchange-execute` package contains an addon `executeExchange` for `urql` that may be used to
execute queries against a local schema. It is therefore a drop-in replacement for the default
_fetchExchange_ and useful for the server-side, debugging, or testing.

## Installation and Setup

First install `@urql/exchange-execute` alongside `urql`:

```sh
yarn add @urql/exchange-retry
# or
npm install --save @urql/exchange-retry
```

You'll then need to add the `executeExchange`, exposed by this package, to your `Client`.
It'll typically replace the `fetchExchange` or similar exchanges and must be used last if possible,
since it'll handle operations and return results.

```js
import { createClient, dedupExchange, cacheExchange } from 'urql';
import { executeExchange } from '@urql/exchange-execute';

const client = createClient({
  url: '/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange,
    executeExchange({
      /* config */
    }),
  ],
});
```

The `executeExchange` accepts an object of options, which are all similar to the arguments that
`graphql/execution/execute` accepts. Typically you'd pass it the `schema` option, some resolvers
if your schema isn't already executable as `fieldResolver` / `typeResolver` / `rootValue`,
and a `context` value or function.

## Options

| Option          | Description                                                                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `schema`        | This is of type `GraphQLSchema` and accepts either a schema that is or isn't executable. This field is _required_ while all other fields are _optional_.                                                                                         |
| `rootValue`     | The root value that `graphql`'s `execute` will use when starting to execute the schema.                                                                                                                                                          |
| `fieldResolver` | A given field resolver function. Creating an executable schema may be easier than providing this, but this resolver will be passed on to `execute` as expected.                                                                                  |
| `typeResolver`  | A given type resolver function. Creating an executable schema may be easier than providing this, but this resolver will be passed on to `execute` as expected.                                                                                   |
| `context`       | This may either be a function that receives an [`Operation`](./core.md#operation) and returns the context value, or just a plain context value. Similarly to a GraphQL server this is useful as all resolvers will have access to your `context` |
