# @urql/exchange-multipart-fetch

> **DEPRECATION NOTICE**: The `multipartFetchExchange` has been deprecated, and
> `@urql/core` now supports GraphQL Multipart Requests natively. This won't
> break the behaviour of your existing apps, however, it's recommended to remove
> the `multipartFetchExchange` from your apps.

The `multipartFetchExchange` is an exchange that builds on the regular `fetchExchange`
but adds the multipart file upload capability.

## Quick Start Guide

First install `@urql/exchange-multipart-fetch` alongside `urql`:

```sh
yarn add @urql/exchange-multipart-fetch
# or
npm install --save @urql/exchange-multipart-fetch
```

You'll then need to add the `multipartFetchExchange` method, that this package exposes,
to your `exchanges`.

```js
import { createClient, dedupExchange, cacheExchange } from 'urql';
import { multipartFetchExchange } from '@urql/exchange-multipart-fetch';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [dedupExchange, cacheExchange, multipartFetchExchange],
});
```

Now we can start uploading files to our server!
