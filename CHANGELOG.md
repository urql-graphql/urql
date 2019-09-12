# Changelog

All notable changes to this project will be documented in this file.
If a change is missing an attribution, it may have been made by a Core Contributor.

- Critical bugfixes or breaking changes are marked using a `warning` symbol: ⚠️
- Significant new features or enhancements are marked using the `sparkles` symbol: ✨

_The format is based on [Keep a Changelog](http://keepachangelog.com/)._

## vNext

- ⚠ rename `writeFragment` to `updateFragment` and introduce `readQuery` and `readFragment` (see [#73](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/73))

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
