# @urql/exchange-persisted-fetch

## 1.2.1

### Patch Changes

- Omit the `Content-Type: application/json` HTTP header when using GET in the `fetchExchange`, `persistedFetchExchange`, or `multipartFetchExchange`, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#957](https://github.com/FormidableLabs/urql/pull/957))
- Stops sending a persisted query if the hashing function fails, by [@lorenries](https://github.com/lorenries) (See [#934](https://github.com/FormidableLabs/urql/pull/934))
- Updated dependencies (See [#947](https://github.com/FormidableLabs/urql/pull/947), [#962](https://github.com/FormidableLabs/urql/pull/962), and [#957](https://github.com/FormidableLabs/urql/pull/957))
  - @urql/core@1.13.0

## 1.2.0

### Minor Changes

- Pass the parsed GraphQL-document as a second argument to the `generateHash` option, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#887](https://github.com/FormidableLabs/urql/pull/887))

### Patch Changes

- Updated dependencies (See [#911](https://github.com/FormidableLabs/urql/pull/911) and [#908](https://github.com/FormidableLabs/urql/pull/908))
  - @urql/core@1.12.3

## 1.1.0

### Minor Changes

- Adds support for custom hash functions by adding a `generateHash` option to the exchange, by [@lorenries](https://github.com/lorenries) (See [#870](https://github.com/FormidableLabs/urql/pull/870))

### Patch Changes

- Updated dependencies (See [#880](https://github.com/FormidableLabs/urql/pull/880) and [#885](https://github.com/FormidableLabs/urql/pull/885))
  - @urql/core@1.12.2

## 1.0.1

### Patch Changes

- Upgrade to a minimum version of wonka@^4.0.14 to work around issues with React Native's minification builds, which use uglify-es and could lead to broken bundles, by [@kitten](https://github.com/kitten) (See [#842](https://github.com/FormidableLabs/urql/pull/842))
- Updated dependencies (See [#838](https://github.com/FormidableLabs/urql/pull/838) and [#842](https://github.com/FormidableLabs/urql/pull/842))
  - @urql/core@1.12.0

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
  exchanges: [persistedFetchExchange],
});
```

to the following:

```js
import { persistedFetchExchange } from '@urql/exchange-persisted-fetch';

createClient({
  exchanges: [
    // Call the exchange and pass optional options:
    persistedFetchExchange(),
  ],
});
```

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
