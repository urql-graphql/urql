<h2 align="center">@urql/exchange-context</h2>

<p align="center"><strong>An exchange for setting operation context in <code>urql</code></strong></p>

`@urql/exchange-context` is an exchange for the [`urql`](https://github.com/FormidableLabs/urql) GraphQL client which can set the operation context both synchronously as well as asynchronously

## Quick Start Guide

First install `@urql/exchange-context` alongside `urql`:

```sh
yarn add @urql/exchange-context
# or
npm install --save @urql/exchange-context
```

You'll then need to add the `contextExchange`, that this package exposes, to your `urql` Client, the positioning of this exchange depends on whether you set an async setter or not. If you set an async context-setter it's best placed after all the synchronous exchanges (in front of the fetchExchange).

```js
import { createClient, dedupExchange, cacheExchange, fetchExchange } from 'urql';
import { contextExchange } from '@urql/exchange-context';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange,
    executeExchange({
      getContext: async () => {
        return await getToken();
      },
    }),
    fetchExchange,
  ],
});
```

## Maintenance Status

**Active:** Formidable is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.
