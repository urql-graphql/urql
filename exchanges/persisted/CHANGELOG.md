# @urql/exchange-persisted-fetch

## 4.3.0

### Minor Changes

- Mark `@urql/core` as a peer dependency as well as a regular dependency
  Submitted by [@kitten](https://github.com/kitten) (See [#3579](https://github.com/urql-graphql/urql/pull/3579))

## 4.2.0

### Minor Changes

- Add option to enable persisted-operations for subscriptions
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3549](https://github.com/urql-graphql/urql/pull/3549))

## 4.1.1

### Patch Changes

- Warn about cached persisted-miss results in development, when a `persistedExchange()` sees a persisted-miss error for a result that's already seen a persisted-miss error (i.e. two misses). This shouldn't happen unless something is caching persisted errors and we should warn about this appropriately
  Submitted by [@kitten](https://github.com/kitten) (See [#3442](https://github.com/urql-graphql/urql/pull/3442))

## 4.1.0

### Minor Changes

- Allow persisted query logic to be skipped by the `persistedExchange` if the passed `generateHash` function resolves to a nullish value. This allows (A)PQ to be selectively disabled for individual operations
  Submitted by [@kitten](https://github.com/kitten) (See [#3324](https://github.com/urql-graphql/urql/pull/3324))

### Patch Changes

- Updated dependencies (See [#3317](https://github.com/urql-graphql/urql/pull/3317) and [#3308](https://github.com/urql-graphql/urql/pull/3308))
  - @urql/core@4.1.0

## 4.0.1

### Patch Changes

- ⚠️ Fix `persistedExchange` ignoring teardowns in its initial operation mapping. Since the hash function is promisified, which defers any persisted operation, it needs to respect teardowns
  Submitted by [@kitten](https://github.com/kitten) (See [#3312](https://github.com/urql-graphql/urql/pull/3312))

## 4.0.0

### Major Changes

- Update the `preferGetForPersistedQueries` option to include the `'force'` and `'within-url-limit'` values from the Client's `preferGetMethod` option. The default value of `true` no longer sets `OperationContext`'s `preferGetMethod` setting to `'force'`. Instead, the value of `preferGetForPersistedQueries` carries through to the `OperationContext`'s `preferGetMethod` setting for persisted queries
  Submitted by [@NWRichmond](https://github.com/NWRichmond) (See [#3192](https://github.com/urql-graphql/urql/pull/3192))

## 3.0.1

### Patch Changes

- Publish with npm provenance
  Submitted by [@kitten](https://github.com/kitten) (See [#3180](https://github.com/urql-graphql/urql/pull/3180))

## 3.0.0

### Major Changes

- Remove `persistedFetchExchange` and instead implement `persistedExchange`. This exchange must be placed in front of a terminating exchange (such as the default `fetchExchange` or a `subscriptionExchange` that supports persisted queries), and only modifies incoming operations to contain `extensions.persistedQuery`, which is sent on via the API. If the API expects Automatic Persisted Queries, requests are retried by this exchange internally
  Submitted by [@kitten](https://github.com/kitten) (See [#3057](https://github.com/urql-graphql/urql/pull/3057))
- Rename `@urql/exchange-persisted-fetch` to `@urql/exchange-persisted`
  Submitted by [@kitten](https://github.com/kitten) (See [#3057](https://github.com/urql-graphql/urql/pull/3057))

### Minor Changes

- Update exchanges to drop redundant `share` calls, since `@urql/core`’s `composeExchanges` utility now automatically does so for us
  Submitted by [@kitten](https://github.com/kitten) (See [#3082](https://github.com/urql-graphql/urql/pull/3082))

### Patch Changes

- Refactor SHA256 logic to save on bundlesize
  Submitted by [@kitten](https://github.com/kitten) (See [#3052](https://github.com/urql-graphql/urql/pull/3052))
- Upgrade to `wonka@^6.3.0`
  Submitted by [@kitten](https://github.com/kitten) (See [#3104](https://github.com/urql-graphql/urql/pull/3104))
- Add TSDocs for all exchanges, documenting API internals
  Submitted by [@kitten](https://github.com/kitten) (See [#3072](https://github.com/urql-graphql/urql/pull/3072))
- Updated dependencies (See [#3101](https://github.com/urql-graphql/urql/pull/3101), [#3033](https://github.com/urql-graphql/urql/pull/3033), [#3054](https://github.com/urql-graphql/urql/pull/3054), [#3053](https://github.com/urql-graphql/urql/pull/3053), [#3060](https://github.com/urql-graphql/urql/pull/3060), [#3081](https://github.com/urql-graphql/urql/pull/3081), [#3039](https://github.com/urql-graphql/urql/pull/3039), [#3104](https://github.com/urql-graphql/urql/pull/3104), [#3082](https://github.com/urql-graphql/urql/pull/3082), [#3097](https://github.com/urql-graphql/urql/pull/3097), [#3061](https://github.com/urql-graphql/urql/pull/3061), [#3055](https://github.com/urql-graphql/urql/pull/3055), [#3085](https://github.com/urql-graphql/urql/pull/3085), [#3079](https://github.com/urql-graphql/urql/pull/3079), [#3087](https://github.com/urql-graphql/urql/pull/3087), [#3059](https://github.com/urql-graphql/urql/pull/3059), [#3055](https://github.com/urql-graphql/urql/pull/3055), [#3057](https://github.com/urql-graphql/urql/pull/3057), [#3050](https://github.com/urql-graphql/urql/pull/3050), [#3062](https://github.com/urql-graphql/urql/pull/3062), [#3051](https://github.com/urql-graphql/urql/pull/3051), [#3043](https://github.com/urql-graphql/urql/pull/3043), [#3063](https://github.com/urql-graphql/urql/pull/3063), [#3054](https://github.com/urql-graphql/urql/pull/3054), [#3102](https://github.com/urql-graphql/urql/pull/3102), [#3097](https://github.com/urql-graphql/urql/pull/3097), [#3106](https://github.com/urql-graphql/urql/pull/3106), [#3058](https://github.com/urql-graphql/urql/pull/3058), and [#3062](https://github.com/urql-graphql/urql/pull/3062))
  - @urql/core@4.0.0

## 2.1.0

### Minor Changes

- Adds enableForMutation option for exchange-persisted-fetch to enable persisted operations for mutations, by [@geekuillaume](https://github.com/geekuillaume) (See [#2951](https://github.com/urql-graphql/urql/pull/2951))

## 2.0.0

### Major Changes

- **Goodbye IE11!** 👋 This major release removes support for IE11. All code that is shipped will be transpiled much less and will _not_ be ES5-compatible anymore, by [@kitten](https://github.com/kitten) (See [#2504](https://github.com/FormidableLabs/urql/pull/2504))
- Upgrade to [Wonka v6](https://github.com/0no-co/wonka) (`wonka@^6.0.0`), which has no breaking changes but is built to target ES2015 and comes with other minor improvements.
  The library has fully been migrated to TypeScript which will hopefully help with making contributions easier!, by [@kitten](https://github.com/kitten) (See [#2504](https://github.com/FormidableLabs/urql/pull/2504))

### Minor Changes

- Remove the `babel-plugin-modular-graphql` helper, this because the graphql package hasn't converted to ESM yet which gives issues in node environments, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2551](https://github.com/FormidableLabs/urql/pull/2551))

### Patch Changes

- Updated dependencies (See [#2551](https://github.com/FormidableLabs/urql/pull/2551), [#2504](https://github.com/FormidableLabs/urql/pull/2504), [#2619](https://github.com/FormidableLabs/urql/pull/2619), [#2607](https://github.com/FormidableLabs/urql/pull/2607), and [#2504](https://github.com/FormidableLabs/urql/pull/2504))
  - @urql/core@3.0.0

## 1.3.4

### Patch Changes

- Extend peer dependency range of `graphql` to include `^16.0.0`.
  As always when upgrading across many packages of `urql`, especially including `@urql/core` we recommend you to deduplicate dependencies after upgrading, using `npm dedupe` or `npx yarn-deduplicate`, by [@kitten](https://github.com/kitten) (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
- Updated dependencies (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
  - @urql/core@2.3.6

## 1.3.3

### Patch Changes

- ⚠️ Fix Crypto API support for Web Workers and Node Crypto in ESM mode. Previously, when Node Crypto was required in Node ESM mode it would result in an error instead, since we didn't try a dynamic import fallback, by [@kitten](https://github.com/kitten) (See [#2123](https://github.com/FormidableLabs/urql/pull/2123))

## 1.3.2

### Patch Changes

- Optimize for minification by avoiding direct eval call, by [@nderscore](https://github.com/nderscore) (See [#1744](https://github.com/FormidableLabs/urql/pull/1744))
- Updated dependencies (See [#1776](https://github.com/FormidableLabs/urql/pull/1776) and [#1755](https://github.com/FormidableLabs/urql/pull/1755))
  - @urql/core@2.1.5

## 1.3.1

### Patch Changes

- Remove closure-compiler from the build step (See [#1570](https://github.com/FormidableLabs/urql/pull/1570))
- Updated dependencies (See [#1570](https://github.com/FormidableLabs/urql/pull/1570), [#1509](https://github.com/FormidableLabs/urql/pull/1509), [#1600](https://github.com/FormidableLabs/urql/pull/1600), and [#1515](https://github.com/FormidableLabs/urql/pull/1515))
  - @urql/core@2.1.0

## 1.3.0

### Minor Changes

- Add `enforcePersistedQueries` option to `persistedFetchExchange`, which disables automatic persisted queries and retry logic, and instead assumes that persisted queries will be handled like normal GraphQL requests, by [@kitten](https://github.com/kitten) (See [#1358](https://github.com/FormidableLabs/urql/pull/1358))

### Patch Changes

- Updated dependencies (See [#1374](https://github.com/FormidableLabs/urql/pull/1374), [#1357](https://github.com/FormidableLabs/urql/pull/1357), and [#1375](https://github.com/FormidableLabs/urql/pull/1375))
  - @urql/core@2.0.0

## 1.2.3

### Patch Changes

- ⚠️ Fix the production build overwriting the development build. Specifically in the previous release we mistakenly replaced all development bundles with production bundles. This doesn't have any direct influence on how these packages work, but prevented development warnings from being logged or full errors from being thrown, by [@kitten](https://github.com/kitten) (See [#1097](https://github.com/FormidableLabs/urql/pull/1097))
- Updated dependencies (See [#1097](https://github.com/FormidableLabs/urql/pull/1097))
  - @urql/core@1.14.1

## 1.2.2

### Patch Changes

- Deprecate the `Operation.operationName` property in favor of `Operation.kind`. This name was
  previously confusing as `operationName` was effectively referring to two different things. You can
  safely upgrade to this new version, however to mute all deprecation warnings you will have to
  **upgrade** all `urql` packages you use. If you have custom exchanges that spread operations, please
  use [the new `makeOperation` helper
  function](https://formidable.com/open-source/urql/docs/api/core/#makeoperation) instead, by [@bkonkle](https://github.com/bkonkle) (See [#1045](https://github.com/FormidableLabs/urql/pull/1045))
- Updated dependencies (See [#1094](https://github.com/FormidableLabs/urql/pull/1094) and [#1045](https://github.com/FormidableLabs/urql/pull/1045))
  - @urql/core@1.14.0

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
