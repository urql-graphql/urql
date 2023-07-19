---
title: Persistence & Uploads
order: 1
---

# Persisted Queries and Uploads

`urql` supports (Automatic) Persisted Queries, and File Uploads via GraphQL
Multipart requests. For persisted queries to work, some setup work is needed,
while File Upload support is built into `@urql/core@4`.

## Automatic Persisted Queries

Persisted Queries allow us to send requests to the GraphQL API that can easily be cached on the fly,
both by the GraphQL API itself and potential CDN caching layers. This is based on the unofficial
[GraphQL Persisted Queries
Spec](https://github.com/apollographql/apollo-link-persisted-queries#apollo-engine).

With Automatic Persisted Queries the client hashes the GraphQL query and turns it into an SHA256
hash and sends this hash instead of the full query. If the server has seen this GraphQL query before
it will recognise it by its hash and process the GraphQL API request as usual, otherwise it may
respond using a `PersistedQueryNotFound` error. In that case the client is supposed to instead send
the full GraphQL query, and the hash together, which will cause the query to be "registered" with the
server.

Additionally, we could also decide to send these hashed queries as GET requests instead of POST
requests. If we only send the persisted queries with hashes as GET requests then they become a lot
easier for a CDN to cache, as by default most caches would not cache POST requests automatically.

In `urql`, we may use the `@urql/exchange-persisted` package's `persistedExchange` to
enable support for Automatic Persisted Queries. This exchange works alongside other fetch or
subscription exchanges by adding metadata for persisted queries to each GraphQL
request by modifying the `extensions` object of operations.

> **Note:** [You can find a code example for `@urql/exchange-persisted` in an example in the `urql` repository.](https://github.com/urql-graphql/urql/tree/main/examples/with-apq)

### Installation & Setup

First install `@urql/exchange-persisted` alongside `urql`:

```sh
yarn add @urql/exchange-persisted
# or
npm install --save @urql/exchange-persisted
```

You'll then need to add the `persistedExchange` function, that this package exposes,
to your `exchanges`, in front of exchanges that communicate with the API:

```js
import { Client, fetchExchange, cacheExchange } from 'urql';
import { persistedExchange } from '@urql/exchange-persisted';

const client = new Client({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    cacheExchange,
    persistedExchange({
      preferGetForPersistedQueries: true,
    }),
    fetchExchange,
  ],
});
```

As we can see, typically it's recommended to set `preferGetForPersistedQueries` to `true`
to encourage persisted queries to use GET requests instead of POST so that CDNs can do their job.
When set to `true` or `'within-url-limit'`, persisted queries will use GET requests if the
resulting URL doesn't exceed the 2048 character limit.

The `fetchExchange` can see the modifications that the `persistedExchange` is
making to operations, and understands to leave out the `query` from any request
as needed. The same should be happening to the `subscriptionExchange`, if you're
using it for queries.

### Customizing Hashing

The `persistedExchange` also accepts a `generateHash` option. This may be used to swap out the
exchange's default method of generating SHA256 hashes. By default, the exchange will use the
built-in [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) when it's
available, and in Node.js it'll use the [Node Crypto Module](https://nodejs.org/api/crypto.html)
instead.

If you're using [the `graphql-persisted-document-loader` for
Webpack](https://github.com/leoasis/graphql-persisted-document-loader), for instance, then you will
already have a loader generating SHA256 hashes for you at compile time. In that case we could swap
out the `generateHash` function with a much simpler one that uses the `generateHash` function's
second argument, a GraphQL `DocumentNode` object.

```js
persistedExchange({
  generateHash: (_, document) => document.documentId,
});
```

If you're using **React Native** then you may not have access to the Web Crypto API, which means
that you have to provide your own SHA256 function to the `persistedExchange`. Luckily, we can do
so easily by using the first argument `generateHash` receives, a GraphQL query as a string.

```js
import sha256 from 'hash.js/lib/hash/sha/256';

persistedExchange({
  async generateHash(query) {
    return sha256().update(query).digest('hex');
  },
});
```

Additionally, if the API only expects persisted queries and not arbitrary ones and all queries are
pre-registered against the API then the `persistedExchange` may be put into a **non-automatic**
persisted queries mode by giving it the `enforcePersistedQueries: true` option. This disables any
retry logic and assumes that persisted queries will be handled like regular GraphQL requests.

## File Uploads

GraphQL server APIs commonly support the [GraphQL Multipart Request
spec](https://github.com/jaydenseric/graphql-multipart-request-spec) to allow for File Uploads
directly with a GraphQL API.

If a GraphQL API supports this, we can pass a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File)
or a [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) directly into our variables and
define the corresponding scalar for our variable, which is often called `File` or `Upload`.

In a browser, the `File` object may often be retrieved via a
[file input](https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications),
for example.

The `@urql/core@4` package supports File Uploads natively, so we won't have to do any installation
or setup work. When `urql` sees a `File` or a `Blob` anywhere in your `variables`, it switches to
a `multipart/form-data` request, converts the request to a `FormData` object, according to the
GraphQL Multipart Request specification, and sends it off to the API.

> **Note:** Previously, this worked by installing the `@urql/multipart-fetch-exchange` package.
> however, this package has been deprecated and file uploads are now built into `@urql/core@4`.

[You can find a code example for file uploads in an example in the `urql` repository.](https://github.com/urql-graphql/urql/tree/main/examples/with-multipart)
