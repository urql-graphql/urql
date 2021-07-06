# Changelog

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
