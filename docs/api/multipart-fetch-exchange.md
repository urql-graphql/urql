---
title: '@urql/exchange-multipart-fetch'
order: 7
---

# Multipart Fetch Exchange

The `@urql/exchange-multipart-fetch` package contains an addon `multipartFetchExchange` for `urql`
that enables file uploads via `multipart/form-data` POST requests.

It follows the unofficial [GraphQL Multipart Request
Spec](https://github.com/jaydenseric/graphql-multipart-request-spec) which is supported by the
[Apollo Sever package](https://www.apollographql.com/docs/apollo-server/data/file-uploads/).

This exchange uses the same fetch logic as the [`fetchExchange`](./core.md#fetchexchange) and the
[`persistedFetchExchange`](./persisted-fetch-exchange.md) by reusing logic from `@urql/core/internal`.
The `multipartFetchExchange` is a drop-in replacement for the default
[`fetchExchange`](./core.md#fetchexchange) and will act exactly like the `fetchExchange` unless the
`variables` that it receives for mutations contain any `File`s as detected by the `extract-files` package.
If the files are stored in any other type, such as a polyfill `File` or Node `Blob` object then use `multipartFetchExchangeWithOptions()` instead, passing in a function to the `customFileCheck` option that returns a boolean if the given value is one of those custom file objects. Note that the `FormData` polyfill used must also support these file types.

## Installation and Setup

First install `@urql/exchange-multipart-fetch` alongside `urql`:

```sh
yarn add @urql/exchange-multipart-fetch
# or
npm install --save @urql/exchange-multipart-fetch
```

The `multipartFetchExchange` is a drop-in replacement for the `fetchExchange`, which should be
replaced in the list of `exchanges`:

```js
import { createClient, dedupExchange, cacheExchange } from 'urql';
import { multipartFetchExchange } from '@urql/exchange-multipart-fetch';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [dedupExchange, cacheExchange, multipartFetchExchange],
});
```

Or when using a custom `File` polyfill or ponyfill:

```typescript
import { createClient, dedupExchange, cacheExchange } from 'urql';
import { multipartFetchExchange } from '@urql/exchange-multipart-fetch';

export class CustomFile extends Blob {
  constructor(sources: Array<Blob>, public readonly name: string) {
    super(sources);
  }
}
export const isCustomFile = (value: unknown | undefined) =>
  value instanceof CustomFile;

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [
    dedupExchange, 
    cacheExchange, 
    multipartFetchExchangeWithOptions({ customFileCheck: isCustomFile })
  ],
});
```