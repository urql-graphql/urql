---
title: Persistence & Uploads
order: 1
---

# Persisted Queries and Uploads

`urql` supports both [Automatic Persisted
Queries](https://www.apollographql.com/docs/apollo-server/performance/apq/) and [File
Uploads](https://www.apollographql.com/docs/apollo-server/data/file-uploads/).
Both of these features is implemented by enhancing or swapping out the default
[`fetchExchange`](../api/core.md#fetchexchange).

## Automatic Persisted Queries

Persisted Queries allow us to send requests to the GraphQL API that can easily be cached on the fly,
both by the GraphQL API itself and potential CDN caching layers. This is based on the unofficial
[GraphQL Persisted Queries
Spec](https://github.com/apollographql/apollo-link-persisted-queries#apollo-engine).

With Automatic Persisted Queries the client hashes the GraphQL query and turns it into an SHA256
hash and sends this hash instead of the full query. If the server has seen this GraphQL query before
it will recognise it by its hash and process the GraphQL API request as usual, otherwise it may
respond using a `PersistedQueryNotFound` error. In that case the client is supposed to instead send
the full GraphQL query and the hash together, which will cause the query to be "registered" with the
server.

Additionally we could also decide to send these hashed queries as GET requests instead of POST
requests. If we only send the persisted queries with hashes as GET requests then they become a lot
easier for a CDN to cache, as by default most caches would not cache POST requests automatically.

In `urql`, we may use the `@urql/exchange-persisted-fetch` package's `persistedFetchExchange` to
implement Automatic Persisted Queries. This exchange works alongside other fetch exchanges and only
handles `query` operations.

### Installation & Setup

First install `@urql/exchange-persisted-fetch` alongside `urql`:

```sh
yarn add @urql/exchange-persisted-fetch
# or
npm install --save @urql/exchange-persisted-fetch
```

You'll then need to add the `persistedFetchExchange` method, that this package exposes,
to your `exchanges`.

```js
import { createClient, dedupExchange, fetchExchange, cacheExchange } from 'urql';
import { persistedFetchExchange } from '@urql/exchange-persisted-fetch';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange,
    persistedFetchExchange({
      preferGetForPersistedQueries: true,
    }),
    fetchExchange,
  ],
});
```

As we can see, typically it's recommended to set `preferGetForPersistedQueries` to `true` to force
all persisted queries to use GET requests instead of POST so that CDNs can do their job.
We also added the `persistedFetchExchange` in front of the usual `fetchExchange`, since it only
handles queries but not mutations.

The `preferGetForPersistedQueries` is similar to the [`Client`'s
`preferGetMethod`](../api/core.md#client) but only switches persisted queries to use GET requests
instead. This is preferable since sometimes the GraphQL query can grow too large for a simple GET
query to handle, while the `persistedFetchExchange`'s SHA256 hashes will remain predictably small.

### Customizing Hashing

The `persistedFetchExchange` also accepts a `generateHash` option. This may be used to swap out the
exchange's default method of generating SHA256 hashes. By default the exchange will use the
built-in [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) on the
browser, which has been implemented to support IE11 as well. In Node.js it'll use the [Node
Crypto Module](https://nodejs.org/api/crypto.html) instead.

If you're using [the `graphql-persisted-document-loader` for
Webpack](https://github.com/leoasis/graphql-persisted-document-loader) for instance, then you will
already have a loader generating SHA256 hashes for you at compile time. In that case we could swap
out the `generateHash` function with a much simpler one that uses the `generateHash` function's
second argument, a GraphQL `DocumentNode` object.

```js
persistedFetchExchange({
  generateHash: (_, document) => document.documentId,
});
```

If you're using **React Native** then you may not have access to the Web Crypto API, which means
that you have to provide your own SHA256 function to the `persistedFetchExchange`. Luckily we can do
so easily by using the first argument `generateHash` receives, a GraphQL query as a string.

```js
import sha256 from 'hash.js/lib/hash/sha/256';

persistedFetchExchange({
  generateHash: async query => {
    return sha256().update(query).digest('hex');
  },
});
```

[Read more about `@urql/persisted-fetch-exchange` in our API
docs.](../api/persisted-fetch-exchange.md)

## File Uploads

GraphQL server frameworks like [Apollo Server support an unofficial spec for file
uploads.](https://www.apollographql.com/docs/apollo-server/data/file-uploads/) This allows us to
define mutations on our API that accept an `Upload` input, which on the client would be a variable
that we can set to a [File](https://developer.mozilla.org/en-US/docs/Web/API/File), which we'd
typically retrieve via a [file input for
instance](https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications).

In `urql`, we may use the `@urql/exchange-multipart-fetch` package's `multipartFetchExchange` to
support file uploads, which is a drop-in replacement for the default
[`fetchExchange`](../api/core.md#fetchexchange). It may also be used [alongside the
`persistedFetchExchange`](#automatic-persisted-queries).

It works by using the [`extract-files` package](https://www.npmjs.com/package/extract-files). When
the `multipartFetchExchange` sees at least one `File` in the variables it receives for a mutation,
then it will send a `multipart/form-data` POST request instead of a standard `application/json`
one. This is basically the same kind of request that we'd expect to send for regular HTML forms.

### Installation & Setup

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
  url: '/graphql',
  exchanges: [dedupExchange, cacheExchange, multipartFetchExchange],
});
```

If you're using the `persistedFetchExchange` then put the `persistedFetchExchange` in front of the
`multipartFetchExchange`, since only the latter is a full replacement for the `fetchExchange` and
the former only handled query operations.

[Read more about `@urql/multipart-fetch-exchange` in our API
docs.](../api/multipart-fetch-exchange.md)
