# 0.2.2 => 1.0.0+

## Additions

- `Client` / `createClient` config object has additional optional value `exchanges`.
- `Client` adds a config option for handling subscriptions: `forwardSubscription` with a type of `(operation, observer) => {unsubscribe: () => void}`
- `Connect` child function argument `mutations` is now typed.

## Changes

- `query` function has been renamed to `createQuery` for clarity.
- `mutation` function has been renamed to `createMutation` for clarity.
- `Client` has been replaced with functional client; created using `createClient`.
- `createClient` returns an object with a function for creating a client instance - see documentation for further information.
- `Connect` component prop `query` now only supports a single query element (multiple GraphQL query strings can be declared in a single Query object).
- `Connect` component prop `mutation` is now named `mutations`.
- `Connect` component prop `subscription` is now named `subscriptions` and is an array of subscriptions.
- `Connect` component prop `updateSubscription` signature slightly changed to the following: `(type, state, data) => newState`.
- `Connect` child function argument now groups mutations into a single `mutations` property.
- `Connect` child function argument property `refetch` now takes a single boolean value for refreshing cache.
- `Exchanges` have changed substantially, please see documentation for more information (default exchanges should work as expected).

## Removals

- `Client` / `createClient` config object no longer has optional value `initialCache`.
- `Client` / `createClient` config object no longer has optional value `cache` (`Custom Caches` are replaced by the ability to create _Exchanges_).
- `Client` / `createClient` config object no longer has optional value `transformExchange` (transforms should be handled by _Exchanges_).
- `Connect` component prop `shouldInvalidate` is no longer used (use `refetch(true)` or implement custom cache Exchange if needed).
- `Connect` component prop `cache` is no longer used (declare exchanges in `Client` without cacheExchange if caching needs to be disabled).
- `Connect` component prop `typeInvalidation` is no longer used (create custom exchange if typeInvalidation is not desired).
- `Connect` child function argument no longer provides `loaded` boolean value.
- `Connect` child function argument no longer provides `refreshAllFromCache` function.
