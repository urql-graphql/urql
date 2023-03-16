---
title: Core / Node.js
order: 3
---

# Core and Node.js Usage

The `@urql/core` package contains `urql`'s `Client`, some common utilities, and some default
_Exchanges_. These are the shared, default parts of `urql` that we will be using no matter which
framework we're interacting with.

All framework bindings — meaning `urql`, `@urql/preact`, `@urql/svelte`, and `@urql/vue` — reexport
all exports of our `@urql/core` core library. This means that if we want to use `urql`'s `Client`
imperatively or with Node.js we'd use `@urql/core`'s utilities or the `Client` directly.

In other words, if we're using framework bindings then writing `import { Client } from "@urql/vue"`
for instance is the same as `import { Client } from "@urql/core"`.
This means that we can use the core utilities and exports that are shared between all bindings
directly or install `@urql/core` separately. We can even use `@urql/core` directly without any
framework bindings.

## Installation

As we said above, if we are using bindings then those will already have installed `@urql/core` as
they depend on it. They also all re-export all exports from `@urql/core`, so we can use those
regardless of which bindings we've installed. However, it's also possible to explicitly install
`@urql/core` or use it standalone, e.g. in a Node.js environment.

```sh
yarn add @urql/core graphql
# or
npm install --save @urql/core graphql
```

Since all bindings and all exchanges depend on `@urql/core`, we may sometimes run into problems
where the package manager installs _two versions_ of `@urql/core`, which is a duplication problem.
This can cause type errors in TypeScript or cause some parts of our application to bundle two
different versions of the package or use slightly different utilities. We can fix this by
deduplicating our dependencies.

```sh
npx yarn-deduplicate && yarn
# or
npm dedupe
```

## GraphQL Tags

A notable utility function is the `gql` tagged template literal function, which is a drop-in
replacement for `graphql-tag`, if you're coming from other GraphQL clients.

Wherever `urql` accepts a query document, we can either pass a string or a `DocumentNode`. `gql` is
a utility that allows a `DocumentNode` to be created directly, and others to be interpolated into
it, which is useful for fragments for instance. This function will often also mark GraphQL documents
for syntax highlighting in most code editors.

In most examples we may have passed a string to define a query document, like so:

```js
const TodosQuery = `
  query {
    todos {
      id
      title
    }
  }
`;
```

We may also use the `gql` tag function to create a `DocumentNode` directly:

```js
import { gql } from '@urql/core';

const TodosQuery = gql`
  query {
    todos {
      id
      title
    }
  }
`;
```

Since all framework bindings also re-export `@urql/core`, we may also import `gql` from `'urql'`,
`'@urql/svelte'` and other bindings directly.

We can also start interpolating other documents into the tag function. This is useful to compose
fragment documents into a larger query, since it's common to define fragments across components of
an app to spread out data dependencies. If we accidentally use a duplicate fragment name in a
document, `gql` will log a warning, since GraphQL APIs won't accept duplicate names.

```js
import { gql } from '@urql/core';

const TodoFragment = gql`
  fragment SmallTodo on Todo {
    id
    title
  }
`;

const TodosQuery = gql`
  query {
    todos {
      ...TodoFragment
    }
  }

  ${TodoFragment}
`;
```

This usage will look familiar when coming from the `graphql-tag` package. The `gql` API is
identical, and its output is approximately the same. The two packages are also intercompatible.
However, one small change in `@urql/core`'s implementation is that your fragment names don't
have to be globally unique, since it's possible to create some one-off fragments occasionally,
especially for `@urql/exchange-graphcache`'s configuration.
It also pre-generates a "hash key" for the `DocumentNode` which is what `urql` does anyway, thus
avoiding some extra work compared to when the `graphql-tag` package is used with `urql`.

## Using the `urql` Client

The `Client` is the main "hub" and store for everything that `urql` does. It is used by all
framework bindings and from the other pages in the "Basics" section we can see that creating a
`Client` comes up across all bindings and use-cases for `urql`.

[Read more about the `Client` and `urql`'s architecture on the "Architecture"
page.](../architecture.md)

### Setting up the `Client`

The `@urql/core` package exports a `Client` class, which we can use to
create the GraphQL client. This central `Client` manages all of our GraphQL requests and results.

```js
import { Client, cacheExchange, fetchExchange } from '@urql/core';

const client = new Client({
  url: 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
});
```

At the bare minimum we'll need to pass an API's `url`, and the `fetchExchange`,
when we create a `Client` to get started.

Another common option is `fetchOptions`. This option allows us to customize the options that will be
passed to `fetch` when a request is sent to the given API `url`. We may pass in an options object, or
a function returning an options object.

In the following example we'll add a token to each `fetch` request that our `Client` sends to our
GraphQL API.

```js
const client = new Client({
  url: 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    const token = getToken();
    return {
      headers: { authorization: token ? `Bearer ${token}` : '' },
    };
  },
});
```

### The `Client`s options

As we've seen above, the most important options for the `Client` are `url` and `exchanges`.
The `url` option is used by the `fetchExchange` to send GraphQL requests to an API.

The `exchanges` option is of particular importance however because it tells the `Client` what to do
with our GraphQL requests:

```js
import { Client, cacheExchange, fetchExchange } from '@urql/core';

const client = new Client({
  url: 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
});
```

For instance, here, the `Client`'s caching and fetching features are only available because we're
passing it exchanges. In the above example, the `Client` will try to first read a GraphQL request
from a local cache, and if this request isn't cached it'll make an HTTP request.
The caching in `urql` is also implemented as an exchange, so for instance, the behavior described
on the ["Document Caching" page](./document-caching.md) is all contained within the `cacheExchange`
above.

Later, [in the "Advanced" section](../advanced/README.md) we'll see many more features that `urql`
supports by adding new exchanges to this list. On [the "Architecture" page](../architecture.md)
we'll also learn more about what exchanges are and why they exist.

### One-off Queries and Mutations

When you're using `urql` to send one-off queries or mutations — rather than in full framework code,
where updates are important — it's common to convert the streams that we get to promises. The
`client.query` and `client.mutation` methods have a shortcut to do just that.

```js
const QUERY = `
  query Test($id: ID!) {
    getUser(id: $id) {
      id
      name
    }
  }
`;

client
  .query(QUERY, { id: 'test' })
  .toPromise()
  .then(result => {
    console.log(result); // { data: ... }
  });
```

In the above example we're executing a query on the client, are passing some variables and are
calling the `toPromise()` method on the return value to execute the request immediately and get the
result as a promise. This may be useful when we don't plan on cancelling queries, or we don't
care about future updates to this data and are just looking to query a result once.

This can also be written using async/await by simply awaiting the return value of `client.query`:

```js
const QUERY = `
  query Test($id: ID!) {
    getUser(id: $id) {
      id
      name
    }
  }
`;

async function query() {
  const result = await client.query(QUERY, { id: 'test' });
  console.log(result); // { data: ... }
}
```

The same can be done for mutations by calling the `client.mutation` method instead of the
`client.query` method.

It's worth noting that promisifying a query result will always only give us _one_ result, because
we're not calling `subscribe`. This means that we'll never see cache updates when we're asking for
a single result like we do above.

#### Reading only cache data

Similarly there's a way to read data from the cache synchronously, provided that the cache has
received a result for a given query before. The `Client` has a `readQuery` method, which is a
shortcut for just that.

```js
const QUERY = `
  query Test($id: ID!) {
    getUser(id: $id) {
      id
      name
    }
  }
`;

const result = client.readQuery(QUERY, { id: 'test' });

result; // null or { data: ... }
```

In the above example we call `readQuery` and receive a result immediately. This result will be
`null` if the `cacheExchange` doesn't have any results cached for the given query.

### Subscribing to Results

GraphQL Clients are by their nature "reactive", meaning that when we execute a query, we expect to
get future results for this query. [On the "Document Caching" page](./document-caching.md) we'll
learn how mutations can invalidate results in the cache. This process (and others just like it) can
cause our query to be refetched.

In essence, if we're subscribing to results rather than using a promise, like we've seen above, then
we're able to see future changes for our query's results. If a mutation causes a query to be
refetched from our API in the background then we'll see a new result. If we execute a query
somewhere else then we'll get notified of the new API result as well, as long as we're subscribed.

```js
const QUERY = `
  query Test($id: ID!) {
    getUser(id: $id) {
      id
      name
    }
  }
`;

const { unsubscribe } = client.query(QUERY, { id: 'test' }).subscribe(result => {
  console.log(result); // { data: ... }
});
```

This code example is similar to the one before. However, instead of sending a one-off query, we're
subscribing to the query. Internally, this causes the `Client` to do the same, but the
subscription means that our callback may be called repeatedly. We may get future results as well as
the first one.

This also works synchronously. As we've seen before `client.readQuery` can give us a result
immediately if our cache already has a result for the given query. The same principle applies here!
Our callback will be called synchronously if the cache already has a result.

Once we're not interested in any results anymore, we need to clean up after ourselves by calling
`unsubscribe`. This stops the subscription and makes sure that the `Client` doesn't actively update
the query anymore or refetches it. We can think of this pattern as being very similar to events or
event hubs.

We're using [the Wonka library for our streams](https://wonka.kitten.sh/basics/background), which
we'll learn more about [on the "Architecture" page](../architecture.md). But we can think of this as
React's effects being called over time, or as `window.addEventListener`.

## Common Utilities in Core

The `@urql/core` package contains other utilities that are shared between multiple addon packages.
This is a short but non-exhaustive list. It contains,

- [`CombinedError`](../api/core.md#combinederror) - our abstraction to combine one or more `GraphQLError`(s) and a `NetworkError`
- `makeResult` and `makeErrorResult` - utilities to create _Operation Results_
- [`createRequest`](../api/core.md#createrequest) - a utility function to create a request from a
  query, and some variables (which generate a stable _Operation Key_)

There are other utilities not mentioned here. Read more about the `@urql/core` API in the [API docs](../api/core.md).

## Reading on

This concludes the introduction for using `@urql/core` without any framework bindings. This showed
just a couple of ways to use `gql` or the `Client`, however you may also want to learn more about
[how to use `urql`'s streams](../architecture.md#stream-patterns-in-urql). Furthermore, apart from the framework
binding introductions, there are some other pages that provide more information on how to get fully
set up with `urql`:

- [How does the default "document cache" work?](./document-caching.md)
- [How are errors handled and represented?](./errors.md)
- [A quick overview of `urql`'s architecture and structure.](../architecture.md)
- [Setting up other features, like authentication, uploads, or persisted queries.](../advanced/README.md)
