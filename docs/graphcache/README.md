---
title: Graphcache
order: 5
---

# Graphcache

In `urql`, caching is fully configurable via [_Exchanges_](../concepts/exchanges.md) and the default
`cacheExchange` in `urql` offers a ["Document Cache"](../basics/document-caching.md), which is
sufficient for sites that heavily rely and render static content. However as an app grows more
complex it's likely that the data and state that `urql` manages, will also grow more complex and
introduce interdependencies between data.

To solve this problem most GraphQL clients resort to caching data in a normalized format, similar to
how [data is often structured in
Redux.](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape/)

In `urql`, normalized caching is an opt-in feature which is provided by the
`@urql/exchange-graphcache` package, _Graphcache_ for short.

## Features

The following pages introduce different features in _Graphcache_ which together make it a compelling
alternative to the standard [document cache](../basics/document-caching.md) that `urql` uses by
default.

- 🔁 [**Fully reactive, normalized caching.**](./normalized-caching.md) _Graphcache_ stores data in
  a normalized data structure. Query, mutation, and subscription results may update one another if
  they share data, and the app will rerender or refetch data accordingly. This often allows your app
  to make less API requests, since data may already be in the cache.
- 💾 [**Custom cache resolvers**](./computed-queries.md) Since all queries are fully resolved in the
  cache before and after they're sent, you can add custom resolvers that enable you to format data,
  implement pagination, or implement cache redirects.
- 💭 [**Subscription and Mutation updates**](./custom-updates.md) You can implement update functions
  that tell _Graphcache_ how to update its data after a mutation has been executed, or whenever a
  subscription sends a new event. This allows the cache to reactively update itself without queries
  having to perform a refetch.
- 🏃 [**Optimistic mutation updates**](./custom-updates.md) When implemented, optimistic updates can
  provide the data that the GraphQL API is expected to send back before the request succeeds, which
  allows the app to instantly render an update while the GraphQL mutation is executed in the
  background.
- 🧠 [**Opt-in schema awareness**](./schema-awareness.md) _Graphcache_ also optionally accepts your
  entire schema, which allows it to resolve _partial data_ before making a request to the GraphQL
  API, allowing an app to render everything that's cached before receiving all missing data. It also
  allows _Graphcache_ to output more helpful warnings and to handle interfaces and enums correctly
  without heuristics.
- 📡 [**Offline support**](./offline.md) _Graphcache_ can persist and rehydrate its entire state,
  allowing an offline application to be built that is able to execute queries against the cache
  although the device is offline.
- 🐛 [**Errors and warnings**](./errors.md). All potential errors are documented with information on
  how you may be able to fix them.

## Installation and Setup

We can add _Graphcache_ by installing the `@urql/exchange-graphcache` package.
Using the package won't increase your bundle size by as much as platforms like
[Bundlephobia](https://bundlephobia.com/result?p=@urql/exchange-graphcache) may suggest, since it
shares the dependency on `wonka` and `@urql/core` with the framework bindings package, e.g. `urql`
or `@urql/preact`, that you're already using.

```sh
yarn add @urql/exchange-graphcache
# or
npm install --save @urql/exchange-graphcache
```

The package exports the `cacheExchange` which replaces the default `cacheExchange` in `@urql/core`.
This new `cacheExchange` must be instantiated using some options, which are used to customise
_Graphcache_ as introduced in the ["Features" section above.](#features) However, you can get started
without passing any options.

```js
import { createClient, dedupExchange, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [dedupExchange, cacheExchange({}), fetchExchange],
});
```

This will automatically enable normalized caching, and you may find that in a lot of cases,
_Graphcache_ already does what you'd expect it to do without any additional configuration. We'll
explore how to customize and set up different parts of _Graphcache_ on the following pages.

[Read more about "Normalized Caching" on the next page.](./normalized-caching.md)
