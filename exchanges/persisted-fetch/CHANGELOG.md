# @urql/exchange-persisted-fetch

## 0.1.1

### Patch Changes

- ⚠️ Fix `persistedFetchExchange` not sending the SHA256 hash extension after a cache miss (`PersistedQueryNotFound` error), by [@kitten](https://github.com/kitten) (See [#766](https://github.com/FormidableLabs/urql/pull/766))

## 0.1.0

This is the initial release of `@urql/exchange-persisted-fetch` which adds Persisted Queries
support, and is an exchange that can be used alongside the default `fetchExchange` or
`@urql/exchange-multipart-fetch`.

It's still experimental, just like `@urql/exchange-multipart-fetch`, so please test it with care and
report any bugs you find.
