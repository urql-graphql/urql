---
title: Exchanges
order: 3
---

<a name="exchanges"></a>

# Exchanges

## Packages

These exchanges can be imported from the `urql` package.

- `cacheExchange`: the default document cache implementation
- `debugExchange`: logs information about ongoing operations and results
- `dedupExchange`: deduplicates ongoing operations
- `fetchExchange`: sends operations to GraphQL HTTP endpoints and resolves results
- `ssrExchange`: used to cache results during SSR and rehydrate them on the client-side
- `subscriptionExchange`: used to support GraphQL subscriptions
- `populateExchange`: will automatically populate the body of your mutations, [more info](https://github.com/FormidableLabs/urql/tree/singularity/docs/graphcache/Populate.md)
- `graphcacheExchange`: used to implement a normalised cache
  - [About architecture](https://github.com/FormidableLabs/urql/tree/singularity/docs/graphcache/architecture.md)
  - [About resolvers](https://github.com/FormidableLabs/urql/tree/singularity/docs/graphcache/resolvers.md)
  - [About updates](https://github.com/FormidableLabs/urql/tree/singularity/docs/graphcache/updates.md)
  - [About keys](https://github.com/FormidableLabs/urql/tree/singularity/docs/graphcache/keys.md)
  - [About optimistic](https://github.com/FormidableLabs/urql/tree/singularity/docs/graphcache/optimistic.md)
  - [About schema-awareness](https://github.com/FormidableLabs/urql/tree/singularity/docs/graphcache/schema.md)
  - [Error-codes](https://github.com/FormidableLabs/urql/tree/singularity/docs/graphcache/help.md)

## Addons

- [`@urql/devtools`](https://github.com/FormidableLabs/urql-devtools): A Chrome extension for monitoring and debugging
- [`@urql/exchange-suspense`](https://github.com/FormidableLabs/urql-exchange-suspense): An experimental exchange for using `<React.Suspense>`
- [`urql-persisted-queries`](https://github.com/Daniel15/urql-persisted-queries): An exchange for adding persisted query support
