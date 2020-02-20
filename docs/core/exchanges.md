---
title: Exchanges
order: 3
---

# Exchanges

## Packages

These exchanges can be imported from the `urql` package.

- `cacheExchange`: the default document cache implementation
- `debugExchange`: logs information about ongoing operations and results
- `dedupExchange`: deduplicates ongoing operations
- `fetchExchange`: sends operations to GraphQL HTTP endpoints and resolves results
- `ssrExchange`: used to cache results during SSR and rehydrate them on the client-side
- `subscriptionExchange`: used to support GraphQL subscriptions

## Addons

- [`@urql/devtools`](https://github.com/FormidableLabs/urql-devtools): A Chrome extension for monitoring and debugging
- [`@urql/exchange-suspense`](https://github.com/FormidableLabs/urql-exchange-suspense): An experimental exchange for using `<React.Suspense>`
- [`urql-persisted-queries`](https://github.com/Daniel15/urql-persisted-queries): An exchange for adding persisted query support
