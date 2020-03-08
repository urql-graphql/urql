# @urql/exchange-multipart-fetch

The `multipartFetchExchange` is an exchange that builds on the regular `fetchExchange`
but adds the multipart file upload capability.

## Quick Start Guide

First install `@urql/exchange-multipart-fetch` alongside `urql`:

```sh
yarn add @urql/exchange-multipart-fetch
# or
npm install --save @urql/exchange-multipart-fetch
```

You'll then need to add the `multipartFetchExchange`, that this package exposes.

```js
import { createClient, dedupExchange, cacheExchange } from 'urql';
import { multipartFetchExchange } from '@urql/exchange-multipart-fetch';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange,
    multipartFetchExchange,
  ],
});
```

now we can start uploading files to our server!
