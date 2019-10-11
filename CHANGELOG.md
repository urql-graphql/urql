# Changelog

All notable changes to this project will be documented in this file.
If a change is missing an attribution, it may have been made by a Core Contributor.

- Critical bugfixes or breaking changes are marked using a `warning` symbol: ⚠️
- Significant new features or enhancements are marked using the `sparkles` symbol: ✨

_The format is based on [Keep a Changelog](http://keepachangelog.com/)._

## [v1.1.0](https://github.com/FormidableLabs/urql-exchange-graphcache/compare/v1.0.3...v1.1.0)

This is a minor release since it increases the peer dependency of `urql` to `>= 1.6.0`, due to the addition
of the `stale` flag to partial responses and `cache-and-network` responses. This flag is useful to check
whether more requests are being made in the background by `@urql/exchange-graphcache`.

Additionally, this release adds a small stack to every error and warning that indicates where an
error has occured. It lists out the query and all subsequent fragments it has been traversing
so that errors and warnings can be traced more easily.

- Add a query/fragment stack to all errors and warnings (see [#107](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/107))
- Add `stale: true` to all `cache-and-network` and partial responses (see [#108](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/108))

## [v1.0.3](https://github.com/FormidableLabs/urql-exchange-graphcache/compare/v1.0.2...v1.0.3)

- Fix `relayPagination` helper merging pages with different field arguments (see [#104](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/104))

## [v1.0.2](https://github.com/FormidableLabs/urql-exchange-graphcache/compare/v1.0.1...v1.0.2)

- Deduplicate connections in `Store.writeConnection` when possible (see [#103](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/103))
- Fix early bail-out in `relayPagination` helper (see [#103](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/103))

## [v1.0.1](https://github.com/FormidableLabs/urql-exchange-graphcache/compare/v1.0.0...v1.0.1)

- Trims down the size by 100 bytes (see [#96](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/96))
- Include the `/extras` build in the published version (see [#97](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/97))
- Invariant and warnings will now have an error code associated with a more elabore explanation (see [#99](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/99))
- Invariant errors will now be included in your production bundle (see [#100](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/100))
- Fixes the relayPagination helper to correctly return partial results (see [#101](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/101))
- Add special case to relayPagination for first and last during inwards merge (see [#102](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/102))

## [v1.0.0](https://github.com/FormidableLabs/urql-exchange-graphcache/compare/v1.0.0-rc.11...v1.0.0)

> **Note:** The minimum required version of `urql` for this release is now `1.5.1`!

**Hooray it's `v1.0.0` time!** This doesn't mean that we won't be changing little things anymore, but we're so far happy with our API and trust Graphcache to work correctly. We will further iterate on this version with some **planned features**, like "fragment invalidation", garbage collection, and more.

This version refactors the **cache resolvers** and adds some new special powers to them! You can now return almost anything from cache resolvers and trust that it'll do the right thing:

- You can return entity keys, which will resolve the cached entities
- You can return keyable entities, which will also be resolved from cache
- You may also return unkeyable entities, which will be partially resolved from cache, with your resolved values taking precedence

This can also be nested, so that unkeyable entities can eventually lead back to normal, cached entities!

This has enabled us to expose the `relayPagination()` helper! This is a resolver that you can just drop into the `cacheExchange`'s `resolvers` config. It automatically does Relay-style pagination, which is now possible due to our more powerful resolvers! You can import it from `@urql/exchange-graphcache/extras`.

- ✨ Add full cache resolver traversal (see [#91](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/91))
- ✨ Add a new `relayPagination` helper (see [#91](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/91))
- Add a `Cache` interface with all methods (that are safe for userland) having documentation (see [#91](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/91))
- ⚠ Fix non-default root keys (that aren't just `Query`) not being respected (see [#87](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/87))

## [v1.0.0-rc.11](https://github.com/FormidableLabs/urql-exchange-graphcache/compare/v1.0.0-rc.10...v1.0.0-rc.11)

- Fix `updates` not being called for `optimistic` results (see [#83](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/83))
- Add optional `variables` argument to `readFragment` and `writeFragment` (see [#84](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/84))
- ⚠ Fix field arguments not normalising optional `null` values (see [#85](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/85))

## [v1.0.0-rc.10](https://github.com/FormidableLabs/urql-exchange-graphcache/compare/v1.0.0-rc.9...v1.0.0-rc.10)

- ⚠ Fix removing cache entries by upgrading to Pessimism `1.1.4` (see [ae72d3](https://github.com/FormidableLabs/urql-exchange-graphcache/commit/ae72d3b1c8b3e5965e122d5509eb561f68579474))

## [v1.0.0-rc.9](https://github.com/FormidableLabs/urql-exchange-graphcache/compare/v1.0.0-rc.8...v1.0.0-rc.9)

- ⚠ Fix optimistic updates by upgrading to Pessimism `1.1.3` (see [#81](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/81))

## [v1.0.0-rc.8](https://github.com/FormidableLabs/urql-exchange-graphcache/compare/v1.0.0-rc.7...v1.0.0-rc.8)

- Fix warnings being shown for Relay `Connection` and `Edge` embedded types (see [#79](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/79))
- Implement `readFragment` method on `Store` (see [#73](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/73))
- Implement `readQuery` method on `Store` (see [#73](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/73))
- Improve `writeFragment` method on `Store` (see [#73](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/73))

## [v1.0.0-rc.7](https://github.com/FormidableLabs/urql-exchange-graphcache/compare/v1.0.0-rc.6...v1.0.0-rc.7)

- ⚠ Fix reexecuted operations due to dependencies not using `cache-first` (see [0bd58f6](https://github.com/FormidableLabs/urql-exchange-graphcache/commit/0bd58f6))

## [v1.0.0-rc.6](https://github.com/FormidableLabs/urql-exchange-graphcache/compare/v1.0.0-rc.5...v1.0.0-rc.6)

- ⚠ Fix concurrency issue where a single operation is reexecuted multiple times (see [#70](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/70))
- Skip writing `undefined` to the cache and log a warning in development (see [#71](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/71))
- Allow `query` to be passed as a string to `store.updateQuery` (see [#72](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/72))

## [v1.0.0-rc.5](https://github.com/FormidableLabs/urql-exchange-graphcache/compare/v1.0.0-rc.4...v1.0.0-rc.5)

- ⚠ Fix user-provided `keys` config not being able to return `null` (see [#68](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/68))

## [v1.0.0-rc.4](https://github.com/FormidableLabs/urql-exchange-graphcache/compare/v1.0.0-rc.3...v1.0.0-rc.4)

- ⚠ Fix development warnings throwing an error for root fields (see [#65](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/65))

## [v1.0.0-rc.3](https://github.com/FormidableLabs/urql-exchange-graphcache/compare/v1.0.0-rc.2...v1.0.0-rc.3)

_Note: This is release contains a bug that `v1.0.0-rc.4` fixes_

- Fix warning condition for missing entity keys (see [98287ae](https://github.com/FormidableLabs/urql-exchange-graphcache/commit/98287ae))

## [v1.0.0-rc.2](https://github.com/FormidableLabs/urql-exchange-graphcache/compare/v1.0.0-rc.1...v1.0.0-rc.2)

_Note: This is release contains a bug that `v1.0.0-rc.3` fixes_

- Add warnings for unknown fields based on the schema and deduplicate warnings (see [#63](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/63))

## [v1.0.0-rc.1](https://github.com/FormidableLabs/urql-exchange-graphcache/compare/v1.0.0-rc.0...v1.0.0-rc.1)

This is the first release that adds _schema awareness_. Passing a schema to Graphcache allows it to make deterministic
assumptions about the cached results it generates from its data. It can deterministically match fragments to interfaces,
instead of resorting to a heuristic, and it can provide _partial results_ for queries. With a `schema` passed to Graphcache,
as long as only nullable fields are uncached and missing, it will still provide an initial cached result.

- ✨ Add schema awareness using the `schema` option (see [#58](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/58))
- ✨ Allow for partial results to cascade missing values upwards (see [#59](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/59))
- Fix `store.keyOfEntity` not using root names from the schema (see [#62](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/62))

## v1.0.0-rc.0

This is where this CHANGELOG starts.
For a log on what happened in `beta` and `alpha` releases, please read the commit history.
