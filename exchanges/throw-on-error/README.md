# @urql/exchange-throw-on-error (Exchange factory)

`@urql/exchange-throw-on-error` is an exchange for the [`urql`](https://github.com/urql-graphql/urql) GraphQL client that throws on field access to errored fields.

It is built on top of the [`graphql-toe`](https://github.com/graphile/graphql-toe) package - please see that package for more information.

## Quick Start Guide

First install `@urql/exchange-throw-on-error` alongside `urql`:

```sh
yarn add @urql/exchange-throw-on-error
# or
npm install --save @urql/exchange-throw-on-error
```

Then add the `throwOnErrorExchange`, to your client:

```js
import { createClient, cacheExchange, fetchExchange } from 'urql';
import { throwOnErrorExchange } from '@urql/exchange-throw-on-error';

const client = createClient({
  url: '/graphql',
  exchanges: [cacheExchange, throwOnErrorExchange(), fetchExchange],
});
```
