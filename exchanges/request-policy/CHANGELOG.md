# Changelog

## 1.2.1

### Patch Changes

- Omit minified files and sourcemaps' `sourcesContent` in published packages
  Submitted by [@kitten](https://github.com/kitten) (See [#3755](https://github.com/urql-graphql/urql/pull/3755))
- Updated dependencies (See [#3755](https://github.com/urql-graphql/urql/pull/3755))
  - @urql/core@5.1.1

## 1.2.0

### Minor Changes

- Mark `@urql/core` as a peer dependency as well as a regular dependency
  Submitted by [@kitten](https://github.com/kitten) (See [#3579](https://github.com/urql-graphql/urql/pull/3579))

## 1.1.0

### Minor Changes

- Change the request-policy exchange not to rely on OperationMeta set by the cache exchanges
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3521](https://github.com/urql-graphql/urql/pull/3521))

## 1.0.2

### Patch Changes

- Publish with npm provenance
  Submitted by [@kitten](https://github.com/kitten) (See [#3180](https://github.com/urql-graphql/urql/pull/3180))

## 1.0.1

### Patch Changes

- Upgrade to `wonka@^6.3.0`
  Submitted by [@kitten](https://github.com/kitten) (See [#3104](https://github.com/urql-graphql/urql/pull/3104))
- Add TSDocs for all exchanges, documenting API internals
  Submitted by [@kitten](https://github.com/kitten) (See [#3072](https://github.com/urql-graphql/urql/pull/3072))
- Updated dependencies (See [#3101](https://github.com/urql-graphql/urql/pull/3101), [#3033](https://github.com/urql-graphql/urql/pull/3033), [#3054](https://github.com/urql-graphql/urql/pull/3054), [#3053](https://github.com/urql-graphql/urql/pull/3053), [#3060](https://github.com/urql-graphql/urql/pull/3060), [#3081](https://github.com/urql-graphql/urql/pull/3081), [#3039](https://github.com/urql-graphql/urql/pull/3039), [#3104](https://github.com/urql-graphql/urql/pull/3104), [#3082](https://github.com/urql-graphql/urql/pull/3082), [#3097](https://github.com/urql-graphql/urql/pull/3097), [#3061](https://github.com/urql-graphql/urql/pull/3061), [#3055](https://github.com/urql-graphql/urql/pull/3055), [#3085](https://github.com/urql-graphql/urql/pull/3085), [#3079](https://github.com/urql-graphql/urql/pull/3079), [#3087](https://github.com/urql-graphql/urql/pull/3087), [#3059](https://github.com/urql-graphql/urql/pull/3059), [#3055](https://github.com/urql-graphql/urql/pull/3055), [#3057](https://github.com/urql-graphql/urql/pull/3057), [#3050](https://github.com/urql-graphql/urql/pull/3050), [#3062](https://github.com/urql-graphql/urql/pull/3062), [#3051](https://github.com/urql-graphql/urql/pull/3051), [#3043](https://github.com/urql-graphql/urql/pull/3043), [#3063](https://github.com/urql-graphql/urql/pull/3063), [#3054](https://github.com/urql-graphql/urql/pull/3054), [#3102](https://github.com/urql-graphql/urql/pull/3102), [#3097](https://github.com/urql-graphql/urql/pull/3097), [#3106](https://github.com/urql-graphql/urql/pull/3106), [#3058](https://github.com/urql-graphql/urql/pull/3058), and [#3062](https://github.com/urql-graphql/urql/pull/3062))
  - @urql/core@4.0.0

## 1.0.0

### Major Changes

- **Goodbye IE11!** 👋 This major release removes support for IE11. All code that is shipped will be transpiled much less and will _not_ be ES5-compatible anymore, by [@kitten](https://github.com/kitten) (See [#2504](https://github.com/FormidableLabs/urql/pull/2504))
- Upgrade to [Wonka v6](https://github.com/0no-co/wonka) (`wonka@^6.0.0`), which has no breaking changes but is built to target ES2015 and comes with other minor improvements.
  The library has fully been migrated to TypeScript which will hopefully help with making contributions easier!, by [@kitten](https://github.com/kitten) (See [#2504](https://github.com/FormidableLabs/urql/pull/2504))

### Patch Changes

- Updated dependencies (See [#2551](https://github.com/FormidableLabs/urql/pull/2551), [#2504](https://github.com/FormidableLabs/urql/pull/2504), [#2619](https://github.com/FormidableLabs/urql/pull/2619), [#2607](https://github.com/FormidableLabs/urql/pull/2607), and [#2504](https://github.com/FormidableLabs/urql/pull/2504))
  - @urql/core@3.0.0

## 0.1.5

### Patch Changes

- Extend peer dependency range of `graphql` to include `^16.0.0`.
  As always when upgrading across many packages of `urql`, especially including `@urql/core` we recommend you to deduplicate dependencies after upgrading, using `npm dedupe` or `npx yarn-deduplicate`, by [@kitten](https://github.com/kitten) (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
- Updated dependencies (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
  - @urql/core@2.3.6

## 0.1.4

### Patch Changes

- Do not set the TTL unless cache outcome is "miss". Previously we set the TTL on cache "miss" if it was the first time an operation returned a result, now the TTL is only set on cache miss results. This allows the request policy exchange to work when using persisted caching, by [@Mookiies](https://github.com/Mookiies) (See [#1742](https://github.com/FormidableLabs/urql/pull/1742))
- Updated dependencies (See [#1776](https://github.com/FormidableLabs/urql/pull/1776) and [#1755](https://github.com/FormidableLabs/urql/pull/1755))
  - @urql/core@2.1.5

## 0.1.3

### Patch Changes

- ⚠️ Fix TTL being updated to a newer timestamp when a cached result comes in, and prevent TTL from being deleted on our React binding's cache probes. Instead we now never delete the TTL and update it on incoming cache miss results, by [@kitten](https://github.com/kitten) (See [#1641](https://github.com/FormidableLabs/urql/pull/1641))
- Updated dependencies (See [#1634](https://github.com/FormidableLabs/urql/pull/1634) and [#1638](https://github.com/FormidableLabs/urql/pull/1638))
  - @urql/core@2.1.2

## 0.1.2

### Patch Changes

- Remove closure-compiler from the build step (See [#1570](https://github.com/FormidableLabs/urql/pull/1570))
- Updated dependencies (See [#1570](https://github.com/FormidableLabs/urql/pull/1570), [#1509](https://github.com/FormidableLabs/urql/pull/1509), [#1600](https://github.com/FormidableLabs/urql/pull/1600), and [#1515](https://github.com/FormidableLabs/urql/pull/1515))
  - @urql/core@2.1.0

## 0.1.1

### Patch Changes

- ⚠️ Fix non-query operations being upgraded by `requestPolicyExchange` and time being stored by last issuance rather than last result, by [@kitten](https://github.com/kitten) (See [#1377](https://github.com/FormidableLabs/urql/pull/1377))
- Updated dependencies (See [#1374](https://github.com/FormidableLabs/urql/pull/1374), [#1357](https://github.com/FormidableLabs/urql/pull/1357), and [#1375](https://github.com/FormidableLabs/urql/pull/1375))
  - @urql/core@2.0.0

## v0.1.0

**Initial Release**
