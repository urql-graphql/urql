# @urql/exchange-persisted-fetch

## 1.0.0

### Major Changes

- Change the `persistedFetchExchange` to be an exchange factory. The `persistedFetchExchange` now
  expects to be called with options. An optional option, `preferGetForPersistedQueries`, may now
  be passed to send persisted queries as a GET request, even when the `Client`'s `preferGetMethod`
  option is `false`.

To migrate you will have to update your usage of `persistedFetchExchange` from

```js
import { persistedFetchExchange } from '@urql/exchange-persisted-fetch';

createClient({
  exchanges: [
    persistedFetchExchange
  ],
});
```

to the following:

````js
import { persistedFetchExchange } from '@urql/exchange-persisted-fetch';

createClient({
  exchanges: [
    // Call the exchange and pass optional options:
    persistedFetchExchange()
  ],
});
````

### Patch Changes

- Replace `js-sha256` polyfill for Node.js support with Node's Native Crypto API, by [@kitten](https://github.com/kitten) (See [#807](https://github.com/FormidableLabs/urql/pull/807))
- Updated dependencies (See [#798](https://github.com/FormidableLabs/urql/pull/798))
  - @urql/core@1.11.8

## 0.1.3

### Patch Changes

- Add `source` debug name to all `dispatchDebug` calls during build time to identify events by which exchange dispatched them, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#780](https://github.com/FormidableLabs/urql/pull/780))
- Updated dependencies (See [#780](https://github.com/FormidableLabs/urql/pull/780))
  - @urql/core@1.11.7

## 0.1.2

### Patch Changes

- Add a `"./package.json"` entry to the `package.json`'s `"exports"` field for Node 14. This seems to be required by packages like `rollup-plugin-svelte` to function properly, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#771](https://github.com/FormidableLabs/urql/pull/771))
- Updated dependencies (See [#771](https://github.com/FormidableLabs/urql/pull/771))
  - @urql/core@1.11.6

## 0.1.1

### Patch Changes

- ⚠️ Fix `persistedFetchExchange` not sending the SHA256 hash extension after a cache miss (`PersistedQueryNotFound` error), by [@kitten](https://github.com/kitten) (See [#766](https://github.com/FormidableLabs/urql/pull/766))

## 0.1.0

This is the initial release of `@urql/exchange-persisted-fetch` which adds Persisted Queries
support, and is an exchange that can be used alongside the default `fetchExchange` or
`@urql/exchange-multipart-fetch`.

It's still experimental, just like `@urql/exchange-multipart-fetch`, so please test it with care and
report any bugs you find.
