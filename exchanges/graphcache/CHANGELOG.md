# @urql/exchange-graphcache

## 2.2.3

### Patch Changes

- Apply commutative layers to all operations, so now including mutations and subscriptions, to ensure that unordered data is written in the correct order, by [@kitten](https://github.com/kitten) (See [#593](https://github.com/FormidableLabs/urql/pull/593))
- Updated dependencies (See [#607](https://github.com/FormidableLabs/urql/pull/607) and [#601](https://github.com/FormidableLabs/urql/pull/601))
  - @urql/core@1.10.0

## 2.2.2

### Patch Changes

- ⚠️ Fix commutative layer edge case when lowest-priority layer comes back earlier than others, by [@kitten](https://github.com/kitten) (See [#587](https://github.com/FormidableLabs/urql/pull/587))
- Externalise @urql/exchange-populate from bundle, by [@kitten](https://github.com/kitten) (See [#590](https://github.com/FormidableLabs/urql/pull/590))
- ⚠️ Fix teardown events leading to broken commutativity, by [@kitten](https://github.com/kitten) (See [#588](https://github.com/FormidableLabs/urql/pull/588))

## 2.2.1

### Patch Changes

- Remove the shared package, this will fix the types file generation for graphcache, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#579](https://github.com/FormidableLabs/urql/pull/579))
- Updated dependencies (See [#577](https://github.com/FormidableLabs/urql/pull/577))
  - @urql/core@1.9.2

## 2.2.0

### Minor Changes

- Add `cache.invalidate` to invalidate an entity directly to remove it from the cache and all subsequent cache results, e.g. `cache.invalidate({ __typename: 'Todo', id: 1 })`, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#566](https://github.com/FormidableLabs/urql/pull/566))

### Patch Changes

- ⚠️ Fix `cache-only` operations being forwarded and triggering fetch requests, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#551](https://github.com/FormidableLabs/urql/pull/551))
- Apply Query results in-order and commutatively even when results arrive out-of-order, by [@kitten](https://github.com/kitten) (See [#565](https://github.com/FormidableLabs/urql/pull/565))
- Updated dependencies (See [#551](https://github.com/FormidableLabs/urql/pull/551), [#542](https://github.com/FormidableLabs/urql/pull/542), and [#544](https://github.com/FormidableLabs/urql/pull/544))
  - @urql/core@1.9.1

## 2.1.1

### Patch Changes

- Update the `updater` function type of `cache.updateQuery` to have a return type of `DataFields` so that `__typename` does not need to be defined, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#538](https://github.com/FormidableLabs/urql/pull/538))
- ⚠️ Fix updates not being triggered when optimistic updates diverge from the actual result. (See [#160](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/160))
- Refactor away SchemaPredicates helper to reduce bundlesize. (See [#161](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/161))
- Ensure that pagination helpers don't confuse pages that have less params with a
  query that has more params. (See [#156](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/156))
- Updated dependencies (See [#533](https://github.com/FormidableLabs/urql/pull/533), [#519](https://github.com/FormidableLabs/urql/pull/519), [#515](https://github.com/FormidableLabs/urql/pull/515), [#512](https://github.com/FormidableLabs/urql/pull/512), and [#518](https://github.com/FormidableLabs/urql/pull/518))
  - @urql/core@1.9.0

## 2.1.0

This release adds support for cache persistence which is bringing us one step closer to
full offline-support, which we hope to bring you soon.

It also allows `wonka@^4.0.0` as a dependency to be compatible with [`urql@1.8.0`](https://github.com/FormidableLabs/urql/blob/master/CHANGELOG.md#v180). It also fixes a couple of issues in our
new `populateExchange`.

- Refactor internal store code and simplify `Store` (see [#134](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/134))
- ✨ Implement store persistence support (see [#137](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/137))
- ✨ Apply GC to store persistence (see [#138](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/138))
- Remove unused case where scalars are written from an API when links are expected (see [#142](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/142))
- ⚠️ Add support for resolvers causing cache misses (see [#143](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/143))
- ⚠️ Fix nested types (e.g. `[Item!]!`) in `populateExchange` (see [#150](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/150))
- Fix duplicate fragments in `populateExchange` output (see [#151](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/151))
- Allow `wonka@^3.2.1||^4.0.0` to be used (see [#153](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/153))

## 2.0.0

> **Note:** The minimum required version of `urql` for this release is now `1.7.0`!

**Christmas came early!** This version improves performance again by about 25% over `1.2.2`. It also
now ships with two new features: The `populateExchange` and automatic garbage collection.

Including the `populateExchange` is optional. It records all fragments in any active queries, and
populates mutation selection sets when the `@populate` directive is used based on typenames. If your
schema includes `viewer` fields on mutations, which resolve back to your `Query` type, you can use
this to automatically update your app's data when a mutation is made. _(More documentation on this
is coming soon!)_

The garbage collection works by utilising an automatic reference counting algorithm rather than
a mark & sweep algorithm. We feel this is the best tradeoff to maintain good performance during
runtime while minimising the data that is unnecessarily retained in-memory. You don't have to do
_anything_! Graphcache will do its newly added magic in the background.

There are some breaking changes, if you're using `cache.resolveConnections` or `resolveValueOrLink`
then you now need to use `inspectFields` and `resolveFieldByKey` instead. You may also now make
use of `cache.keyOfField`. (More info on [#128](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/128))

- ✨ Implement `populateExchange` (eee [#120](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/120))
- Improve type safety of `invariant` and `warning` (see [#121](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/121))
- Reduce size of `populateExchange` (see [#122](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/122))
- Move more code to KVMap (see [#125](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/125))
- Move deletion to setting `undefined` instead (see [#126](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/126))
- Fix multiple edge cases in the `relayPagination` helper, by [@rafeca](https://github.com/rafeca) (see [#127](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/127))
- ✨⚠️ Reimplement data structure and add garbage collection (see [#128](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/128))
- Use Closure Compiler (see [#131](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/131))
- Switch to using `urql/core` on `1.7.0` (see [#132](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/132))

## 1.2.2

This patch replaces `pessimism` (our former underlying data structure) with a smaller implementation
that just uses `Map`s, since we weren't relying on any immutability internally. This cuts down
on bundlesize and massively on GC-pressure, which provides a large speedup on low-end devices.

- Replace Pessimism with mutable store to prevent excessive GC work (see [#117](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/117))

## 1.2.1

- Fix viewer fields (which return `Query` types) not being written or read correctly (see [#116](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/116))

## 1.2.0

- ⚠️ Fix unions not being checked supported by schema predicates, by [@StevenLangbroek](https://github.com/StevenLangbroek) (see [#113](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/113))
- ✨ Add `simplePagination` helper for resolving simple, paginated lists (see [#115](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/115))

## 1.1.2

- Fix `relayPagination` helper causing cache-misses for empty lists, by [@rafeca](https://github.com/rafeca) (see [#111](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/111))

## 1.1.1

This is a minor release since it increases the peer dependency of `urql` to `>= 1.6.0`, due to the addition
of the `stale` flag to partial responses and `cache-and-network` responses. This flag is useful to check
whether more requests are being made in the background by `@urql/exchange-graphcache`.

Additionally, this release adds a small stack to every error and warning that indicates where an
error has occured. It lists out the query and all subsequent fragments it has been traversing
so that errors and warnings can be traced more easily.

- Add a query/fragment stack to all errors and warnings (see [#107](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/107))
- Add `stale: true` to all `cache-and-network` and partial responses (see [#108](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/108))

## 1.0.3

- Fix `relayPagination` helper merging pages with different field arguments (see [#104](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/104))

## 1.0.2

- Deduplicate connections in `Store.writeConnection` when possible (see [#103](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/103))
- Fix early bail-out in `relayPagination` helper (see [#103](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/103))

## 1.0.1

- Trims down the size by 100 bytes (see [#96](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/96))
- Include the `/extras` build in the published version (see [#97](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/97))
- Invariant and warnings will now have an error code associated with a more elabore explanation (see [#99](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/99))
- Invariant errors will now be included in your production bundle (see [#100](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/100))
- Fixes the relayPagination helper to correctly return partial results (see [#101](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/101))
- Add special case to relayPagination for first and last during inwards merge (see [#102](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/102))

## 1.0.0

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

## 1.0.0-rc.11

- Fix `updates` not being called for `optimistic` results (see [#83](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/83))
- Add optional `variables` argument to `readFragment` and `writeFragment` (see [#84](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/84))
- ⚠ Fix field arguments not normalising optional `null` values (see [#85](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/85))

## 1.0.0-rc.10

- ⚠ Fix removing cache entries by upgrading to Pessimism `1.1.4` (see [ae72d3](https://github.com/FormidableLabs/urql-exchange-graphcache/commit/ae72d3b1c8b3e5965e122d5509eb561f68579474))

## 1.0.0-rc.9

- ⚠ Fix optimistic updates by upgrading to Pessimism `1.1.3` (see [#81](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/81))

## 1.0.0-rc.8

- Fix warnings being shown for Relay `Connection` and `Edge` embedded types (see [#79](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/79))
- Implement `readFragment` method on `Store` (see [#73](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/73))
- Implement `readQuery` method on `Store` (see [#73](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/73))
- Improve `writeFragment` method on `Store` (see [#73](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/73))

## 1.0.0-rc.7

- ⚠ Fix reexecuted operations due to dependencies not using `cache-first` (see [0bd58f6](https://github.com/FormidableLabs/urql-exchange-graphcache/commit/0bd58f6))

## 1.0.0-rc.6

- ⚠ Fix concurrency issue where a single operation is reexecuted multiple times (see [#70](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/70))
- Skip writing `undefined` to the cache and log a warning in development (see [#71](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/71))
- Allow `query` to be passed as a string to `store.updateQuery` (see [#72](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/72))

## 1.0.0-rc.5

- ⚠ Fix user-provided `keys` config not being able to return `null` (see [#68](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/68))

## 1.0.0-rc.4

- ⚠ Fix development warnings throwing an error for root fields (see [#65](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/65))

## 1.0.0-rc.3

_Note: This is release contains a bug that `v1.0.0-rc.4` fixes_

- Fix warning condition for missing entity keys (see [98287ae](https://github.com/FormidableLabs/urql-exchange-graphcache/commit/98287ae))

## 1.0.0-rc.2

_Note: This is release contains a bug that `v1.0.0-rc.3` fixes_

- Add warnings for unknown fields based on the schema and deduplicate warnings (see [#63](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/63))

## 1.0.0-rc.1

This is the first release that adds _schema awareness_. Passing a schema to Graphcache allows it to make deterministic
assumptions about the cached results it generates from its data. It can deterministically match fragments to interfaces,
instead of resorting to a heuristic, and it can provide _partial results_ for queries. With a `schema` passed to Graphcache,
as long as only nullable fields are uncached and missing, it will still provide an initial cached result.

- ✨ Add schema awareness using the `schema` option (see [#58](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/58))
- ✨ Allow for partial results to cascade missing values upwards (see [#59](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/59))
- Fix `store.keyOfEntity` not using root names from the schema (see [#62](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/62))

## 1.0.0-rc.0

This is where this CHANGELOG starts.
For a log on what happened in `beta` and `alpha` releases, please read the commit history.
