# @urql/exchange-graphcache

## 7.2.1

### Patch Changes

- Update selection iterator implementation for JSC memory reduction
  Submitted by [@kitten](https://github.com/kitten) (See [#3693](https://github.com/urql-graphql/urql/pull/3693))

## 7.2.0

### Minor Changes

- Allow @\_required directive to be used in combination with configured schemas
  Submitted by [@AndrewIngram](https://github.com/AndrewIngram) (See [#3685](https://github.com/urql-graphql/urql/pull/3685))

## 7.1.3

### Patch Changes

- ⚠️ fix bug that mutation would cause dependent operations and reexecuting operations to become the same set
  Submitted by [@xuanduc987](https://github.com/xuanduc987) (See [#3665](https://github.com/urql-graphql/urql/pull/3665))

## 7.1.2

### Patch Changes

- Disregard write-only operation when fragment-matching with schema awareness
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3621](https://github.com/urql-graphql/urql/pull/3621))

## 7.1.1

### Patch Changes

- ⚠️ Fix where we would incorrectly match all fragment concrete types because they belong to the abstract type
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3603](https://github.com/urql-graphql/urql/pull/3603))

## 7.1.0

### Minor Changes

- Mark `@urql/core` as a peer dependency as well as a regular dependency
  Submitted by [@kitten](https://github.com/kitten) (See [#3579](https://github.com/urql-graphql/urql/pull/3579))

## 7.0.2

### Patch Changes

- Only record dependencies that are changing data, this will reduce the amount of operations we re-invoke due to network-only/cache-and-network queries and mutations
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3564](https://github.com/urql-graphql/urql/pull/3564))

## 7.0.1

### Patch Changes

- When invoking the automatic creation updater ignore the entity we are currently on in the mutation
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3560](https://github.com/urql-graphql/urql/pull/3560))

## 7.0.0

### Major Changes

- Add a default updater for mutation fields who are lacking an updater and where the returned entity is not present in the cache
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3518](https://github.com/urql-graphql/urql/pull/3518))
- Remove deprecated `resolveFieldByKey`, use `cache.resolve` instead
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3520](https://github.com/urql-graphql/urql/pull/3520))

### Minor Changes

- Track abstract types being written so that we have a more reliable way of matching abstract fragments
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3548](https://github.com/urql-graphql/urql/pull/3548))

### Patch Changes

- ⚠️ Fix `invalidate` not applying when using a string to invalidate an entity
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3545](https://github.com/urql-graphql/urql/pull/3545))
- Upgrade `@0no-co/graphql.web` to `1.0.5`
  Submitted by [@kitten](https://github.com/kitten) (See [#3553](https://github.com/urql-graphql/urql/pull/3553))
- Updated dependencies (See [#3520](https://github.com/urql-graphql/urql/pull/3520), [#3553](https://github.com/urql-graphql/urql/pull/3553), and [#3520](https://github.com/urql-graphql/urql/pull/3520))
  - @urql/core@5.0.0

## 6.5.0

### Minor Changes

- Allow `@_optional` and `@_required` to be placed on fragment definitions and inline fragments
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3502](https://github.com/urql-graphql/urql/pull/3502))
- Track list of entity keys for a given type name. This enables enumerating and invalidating all entities of a given type within the normalized cache
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3501](https://github.com/urql-graphql/urql/pull/3501))

### Patch Changes

- Prevent `@defer` from being applied in child field selections. Previously, a child field (i.e. a nested field) under a `@defer`-ed fragment would also become optional, which was based on a prior version of the DeferStream spec which didn't require deferred fields to be delivered as a group
  Submitted by [@kitten](https://github.com/kitten) (See [#3517](https://github.com/urql-graphql/urql/pull/3517))
- ⚠️ Fix `store.resolve()` returning the exact link array that’s used by the cache. This can lead to subtle bugs when a user mutates the result returned by `cache.resolve()`, since this directly mutates what’s in the cache at that layer
  Submitted by [@kitten](https://github.com/kitten) (See [#3516](https://github.com/urql-graphql/urql/pull/3516))
- Updated dependencies (See [#3514](https://github.com/urql-graphql/urql/pull/3514), [#3505](https://github.com/urql-graphql/urql/pull/3505), [#3499](https://github.com/urql-graphql/urql/pull/3499), and [#3515](https://github.com/urql-graphql/urql/pull/3515))
  - @urql/core@4.3.0

## 6.4.1

### Patch Changes

- Set `stale: true` on cache results, even if a reexecution has been blocked by the loop protection, if the operation is already pending and in-flight
  Submitted by [@kitten](https://github.com/kitten) (See [#3493](https://github.com/urql-graphql/urql/pull/3493))
- ⚠️ Fix `@defer` state leaking into following operations
  Submitted by [@kitten](https://github.com/kitten) (See [#3497](https://github.com/urql-graphql/urql/pull/3497))

## 6.4.0

### Minor Changes

- Allow the user to debug cache-misses by means of the new `logger` interface on the `cacheExchange`. A field miss will dispatch a `debug` log when it's not marked with `@_optional` or when it's non-nullable in the `schema`
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3446](https://github.com/urql-graphql/urql/pull/3446))
- Add `onCacheHydrated` as an option for the `StorageAdapter`
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3428](https://github.com/urql-graphql/urql/pull/3428))
- Add optional `logger` to the options, this allows you to filter out warnings or disable them all together
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3444](https://github.com/urql-graphql/urql/pull/3444))

## 6.3.3

### Patch Changes

- ⚠️ Fix a typo that caused an inverted condition, for checking owned data, to cause incorrect results when handling `null` values and encountering them first
  Submitted by [@kitten](https://github.com/kitten) (See [#3371](https://github.com/urql-graphql/urql/pull/3371))

## 6.3.2

### Patch Changes

- ⚠️ Fix extra variables in mutation results regressing by a change made in [#3317](https://github.com/urql-graphql/urql/pull/3317). The original operation wasn't being preserved anymore
  Submitted by [@kitten](https://github.com/kitten) (See [#3356](https://github.com/urql-graphql/urql/pull/3356))

## 6.3.1

### Patch Changes

- Reset `partial` result marker when reading from selections when a child value sees a cache miss. This only affects resolvers on child values enabling `info.partial` while a parent may abort early instead
  Submitted by [@kitten](https://github.com/kitten) (See [#3340](https://github.com/urql-graphql/urql/pull/3340))
- ⚠️ Fix `@_optional` directive not setting `info.partial = true` on cache miss and fix usage of `info.parentKey` and `info.parentFieldKey` usage in default directives
  Submitted by [@kitten](https://github.com/kitten) (See [#3338](https://github.com/urql-graphql/urql/pull/3338))
- Replace implementation for `@_optional` and `@_required` with built-in handling inside cache reads to allow `@_optional` to work for nested selection sets
  Submitted by [@kitten](https://github.com/kitten) (See [#3341](https://github.com/urql-graphql/urql/pull/3341))

## 6.3.0

### Minor Changes

- Allow scalar values on the parent to be accessed from `parent[info.fieldName]` consistently. Prior to this change `parent[fieldAlias]` would get populated, which wouldn’t always result in a field that’s consistently accessible
  Submitted by [@kitten](https://github.com/kitten) (See [#3336](https://github.com/urql-graphql/urql/pull/3336))
- Allow `cache.resolve` to return `undefined` when a value is not cached to make it easier to cause a cache miss in resolvers. **Reminder:** Returning `undefined` from a resolver means a field is uncached, while returning `null` means that a field’s value is `null` without causing a cache miss
  Submitted by [@kitten](https://github.com/kitten) (See [#3333](https://github.com/urql-graphql/urql/pull/3333))

### Patch Changes

- Record a dependency when `__typename` field is read. This removes a prior, outdated exception to avoid confusion when using `cache.resolve(entity, '__typename')` which doesn't cause the cache to record a dependency
  Submitted by [@kitten](https://github.com/kitten) (See [#3335](https://github.com/urql-graphql/urql/pull/3335))
- ⚠️ Fix cases where `ResolveInfo`’s `parentFieldKey` was incorrectly populated with a key that isn’t a field key (allowing for `cache.resolve(info.parentKey, info.parentFieldKey)` to be possible) but was instead set to `info.parentKey` combined with the field key
  Submitted by [@kitten](https://github.com/kitten) (See [#3336](https://github.com/urql-graphql/urql/pull/3336))

## 6.2.0

### Minor Changes

- Implement **local directives**. It’s now possible to add client-only directives to queries by adding them to the `cacheExchange`’s new `directives` option.
  Directives accept an object of their arguments and return a resolver. When a field is annotated with
  a resolver, e.g. `@_optional` or `@_required`, their resolvers from the `directives` config are
  executed. This means it’s now possible to use `@_relayPagination` for example, by passing adding
  the `relayPagination` helper to the config.
  Due to the change in [#3317](https://github.com/urql-graphql/urql/pull/3317), any directive in
  queries that’s prefixed with an underscore (`_`) is only visible to Graphcache and not the API.
  Submitted by undefined (See https://github.com/urql-graphql/urql/pull/3306)

### Patch Changes

- Use new `FormattedNode` / `formatDocument` functionality added to `@urql/core` to slightly speed up directive processing by using the client-side `_directives` dictionary that `formatDocument` adds
  Submitted by [@kitten](https://github.com/kitten) (See [#3317](https://github.com/urql-graphql/urql/pull/3317))
- Allow `offlineExchange` to once again issue all request policies, instead of mapping them to `cache-first`. When replaying operations after rehydrating it will now prioritise network policies, and before rehydrating receiving a network result will prevent a network request from being issued again
  Submitted by [@kitten](https://github.com/kitten) (See [#3308](https://github.com/urql-graphql/urql/pull/3308))
- Add `OperationContext.optimistic` flag as an internal indication on whether a mutation triggered an optimistic update in `@urql/exchange-graphcache`'s `cacheExchange`
  Submitted by [@kitten](https://github.com/kitten) (See [#3308](https://github.com/urql-graphql/urql/pull/3308))
- Updated dependencies (See [#3317](https://github.com/urql-graphql/urql/pull/3317) and [#3308](https://github.com/urql-graphql/urql/pull/3308))
  - @urql/core@4.1.0

## 6.1.4

### Patch Changes

- ⚠️ Fix untranspiled class property initializer syntax being leftover in build output. (Regression in #3053)
  Submitted by [@kitten](https://github.com/kitten) (See [#3275](https://github.com/urql-graphql/urql/pull/3275))

## 6.1.3

### Patch Changes

- ⚠️ Fix `info.parentKey` not being correctly set for updaters or optimistic updaters
  Submitted by [@kitten](https://github.com/kitten) (See [#3267](https://github.com/urql-graphql/urql/pull/3267))

## 6.1.2

### Patch Changes

- Make "Invalid undefined" warning heuristic smarter and allow for partial optimistic results. Previously, when a partial optimistic result would be passed, a warning would be issued, and in production, fields would be deleted from the cache. Instead, we now only issue a warning if these fields aren't cached already
  Submitted by [@kitten](https://github.com/kitten) (See [#3264](https://github.com/urql-graphql/urql/pull/3264))
- Optimistic mutation results should never result in dependent operations being blocked
  Submitted by [@kitten](https://github.com/kitten) (See [#3265](https://github.com/urql-graphql/urql/pull/3265))

## 6.1.1

### Patch Changes

- ⚠️ Fix torn down queries not being removed from `offlineExchange`’s failed queue on rehydration
  Submitted by [@kitten](https://github.com/kitten) (See [#3236](https://github.com/urql-graphql/urql/pull/3236))

## 6.1.0

### Minor Changes

- Add `globalIDs` configuration option to omit typenames in cache keys
  Submitted by [@kitten](https://github.com/kitten) (See [#3224](https://github.com/urql-graphql/urql/pull/3224))

### Patch Changes

- Update build process to generate correct source maps
  Submitted by [@kitten](https://github.com/kitten) (See [#3201](https://github.com/urql-graphql/urql/pull/3201))
- Prevent `offlineExchange` from issuing duplicate operations
  Submitted by [@kitten](https://github.com/kitten) (See [#3200](https://github.com/urql-graphql/urql/pull/3200))
- ⚠️ Fix reference equality not being preserved. This is a fix on top of [#3165](https://github.com/urql-graphql/urql/pull/3165), and was previously not addressed to avoid having to test for corner cases that are hard to cover. If you experience issues with this fix, please let us know
  Submitted by [@kitten](https://github.com/kitten) (See [#3228](https://github.com/urql-graphql/urql/pull/3228))
- Retry operations against offline cache and stabilize timing of flushing failed operations queue after rehydrating the storage data
  Submitted by [@kitten](https://github.com/kitten) (See [#3196](https://github.com/urql-graphql/urql/pull/3196))

## 6.0.4

### Patch Changes

- ⚠️ Fix missing cache updates, when a query that was previously torn down restarts and retrieves results from the cache. In this case a regression caused cache updates to not be correctly applied to the queried results, since the operation wouldn’t be recognised properly
  Submitted by [@kitten](https://github.com/kitten) (See [#3193](https://github.com/urql-graphql/urql/pull/3193))

## 6.0.3

### Patch Changes

- Publish with npm provenance
  Submitted by [@kitten](https://github.com/kitten) (See [#3180](https://github.com/urql-graphql/urql/pull/3180))

## 6.0.2

### Patch Changes

- Prevent reusal of incoming API data in Graphcache’s produced (“owned”) data. This prevents us from copying the `__typename` and other superfluous fields
  Submitted by [@kitten](https://github.com/kitten) (See [#3165](https://github.com/urql-graphql/urql/pull/3165))
- ⚠️ Fix regression which caused `@defer` directives from becoming “sticky” and causing every subsequent cache read to be treated as if the field was deferred
  Submitted by [@kitten](https://github.com/kitten) (See [#3167](https://github.com/urql-graphql/urql/pull/3167))
- Apply `hasNext: true` and fallthrough logic to cached queries that contain deferred, uncached fields. Deferred query results will now be fetched against the API correctly, even if prior requests have been incomplete
  Submitted by [@kitten](https://github.com/kitten) (See [#3163](https://github.com/urql-graphql/urql/pull/3163))
- ⚠️ Fix `offlineExchange` duplicating offline mutations in failed queue
  Submitted by [@kitten](https://github.com/kitten) (See [#3158](https://github.com/urql-graphql/urql/pull/3158))

## 6.0.1

### Patch Changes

- Remove inclusion and usage of optional chaining operator
  Submitted by [@kitten](https://github.com/kitten) (See [#3116](https://github.com/urql-graphql/urql/pull/3116))

## 6.0.0

### Major Changes

- Remove dependence on `graphql` package and replace it with `@0no-co/graphql.web`, which reduces the default bundlesize impact of `urql` packages to a minimum. All types should remain compatible, even if you use `graphql` elsewhere in your app, and if other dependencies are using `graphql` you may alias it to `graphql-web-lite`
  Submitted by [@kitten](https://github.com/kitten) (See [#3097](https://github.com/urql-graphql/urql/pull/3097))
- Update `OperationResult.hasNext` and `OperationResult.stale` to be required fields. If you have a custom exchange creating results, you'll have to add these fields or use the `makeResult`, `mergeResultPatch`, or `makeErrorResult` helpers
  Submitted by [@kitten](https://github.com/kitten) (See [#3061](https://github.com/urql-graphql/urql/pull/3061))

### Minor Changes

- Update exchanges to drop redundant `share` calls, since `@urql/core`’s `composeExchanges` utility now automatically does so for us
  Submitted by [@kitten](https://github.com/kitten) (See [#3082](https://github.com/urql-graphql/urql/pull/3082))

### Patch Changes

- ⚠️ Fix source maps included with recently published packages, which lost their `sourcesContent`, including additional source files, and had incorrect paths in some of them
  Submitted by [@kitten](https://github.com/kitten) (See [#3053](https://github.com/urql-graphql/urql/pull/3053))
- Upgrade to `wonka@^6.3.0`
  Submitted by [@kitten](https://github.com/kitten) (See [#3104](https://github.com/urql-graphql/urql/pull/3104))
- Restore variables correctly on mutations
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3046](https://github.com/urql-graphql/urql/pull/3046))
- Use `stringifyDocument` in `offlineExchange` rather than `print` and serialize `operation.extensions` as needed
  Submitted by [@kitten](https://github.com/kitten) (See [#3094](https://github.com/urql-graphql/urql/pull/3094))
- Add missing `hasNext` and `stale` passthroughs on caching exchanges
  Submitted by [@kitten](https://github.com/kitten) (See [#3059](https://github.com/urql-graphql/urql/pull/3059))
- Add TSDocs for all exchanges, documenting API internals
  Submitted by [@kitten](https://github.com/kitten) (See [#3072](https://github.com/urql-graphql/urql/pull/3072))
- Updated dependencies (See [#3101](https://github.com/urql-graphql/urql/pull/3101), [#3033](https://github.com/urql-graphql/urql/pull/3033), [#3054](https://github.com/urql-graphql/urql/pull/3054), [#3053](https://github.com/urql-graphql/urql/pull/3053), [#3060](https://github.com/urql-graphql/urql/pull/3060), [#3081](https://github.com/urql-graphql/urql/pull/3081), [#3039](https://github.com/urql-graphql/urql/pull/3039), [#3104](https://github.com/urql-graphql/urql/pull/3104), [#3082](https://github.com/urql-graphql/urql/pull/3082), [#3097](https://github.com/urql-graphql/urql/pull/3097), [#3061](https://github.com/urql-graphql/urql/pull/3061), [#3055](https://github.com/urql-graphql/urql/pull/3055), [#3085](https://github.com/urql-graphql/urql/pull/3085), [#3079](https://github.com/urql-graphql/urql/pull/3079), [#3087](https://github.com/urql-graphql/urql/pull/3087), [#3059](https://github.com/urql-graphql/urql/pull/3059), [#3055](https://github.com/urql-graphql/urql/pull/3055), [#3057](https://github.com/urql-graphql/urql/pull/3057), [#3050](https://github.com/urql-graphql/urql/pull/3050), [#3062](https://github.com/urql-graphql/urql/pull/3062), [#3051](https://github.com/urql-graphql/urql/pull/3051), [#3043](https://github.com/urql-graphql/urql/pull/3043), [#3063](https://github.com/urql-graphql/urql/pull/3063), [#3054](https://github.com/urql-graphql/urql/pull/3054), [#3102](https://github.com/urql-graphql/urql/pull/3102), [#3097](https://github.com/urql-graphql/urql/pull/3097), [#3106](https://github.com/urql-graphql/urql/pull/3106), [#3058](https://github.com/urql-graphql/urql/pull/3058), and [#3062](https://github.com/urql-graphql/urql/pull/3062))
  - @urql/core@4.0.0

## 5.2.0

### Minor Changes

- Add `isOfflineError` option to the `offlineExchange` to allow it to be customized to different conditions to determine whether an operation has failed because of a network error
  Submitted by [@robertherber](https://github.com/robertherber) (See [#3020](https://github.com/urql-graphql/urql/pull/3020))
- Allow `updates` config to react to arbitrary type updates other than just `Mutation` and `Subscription` fields.
  You’ll now be able to write updaters that react to any entity field being written to the cache,
  which allows for more granular invalidations. **Note:** If you’ve previously used `updates.Mutation`
  and `updated.Subscription` with a custom schema with custom root names, you‘ll get a warning since
  you’ll have to update your `updates` config to reflect this. This was a prior implementation
  mistake!
  Submitted by [@kitten](https://github.com/kitten) (See [#2979](https://github.com/urql-graphql/urql/pull/2979))

### Patch Changes

- ⚠️ Fix regression which caused partial results, whose refetches were blocked by the looping protection, to not have a `stale: true` flag added to them. This is a regression from https://github.com/urql-graphql/urql/pull/2831 and only applies to `cacheExchange`s that had the `schema` option set
  Submitted by [@kitten](https://github.com/kitten) (See [#2999](https://github.com/urql-graphql/urql/pull/2999))
- Add `invariant` to data layer that prevents cache writes during cache query operations. This prevents `cache.writeFragment`, `cache.updateQuery`, and `cache.link` from being called in `resolvers` for instance
  Submitted by [@kitten](https://github.com/kitten) (See [#2978](https://github.com/urql-graphql/urql/pull/2978))
- Updated dependencies (See [#3007](https://github.com/urql-graphql/urql/pull/3007), [#2962](https://github.com/urql-graphql/urql/pull/2962), [#3007](https://github.com/urql-graphql/urql/pull/3007), [#3015](https://github.com/urql-graphql/urql/pull/3015), and [#3022](https://github.com/urql-graphql/urql/pull/3022))
  - @urql/core@3.2.0

## 5.0.9

### Patch Changes

- ⚠️ Fix potential data loss in `offlineExchange` that's caused when `onOnline` triggers and flushes mutation queue before the mutation queue is used, by [@trcoffman](https://github.com/trcoffman) (See [#2945](https://github.com/urql-graphql/urql/pull/2945))
- Patch message for `(16) Heuristic Fragment Matching`, by [@inokawa](https://github.com/inokawa) (See [#2923](https://github.com/urql-graphql/urql/pull/2923))
- Patch message for (19) Can't generate a key for invalidate(...) error, by [@inokawa](https://github.com/inokawa) (See [#2918](https://github.com/urql-graphql/urql/pull/2918))

## 5.0.8

### Patch Changes

- ⚠️ Fix operation being blocked for looping due to it not cancelling the looping protection when a `teardown` is received. This bug could be triggered when a shared query operation triggers again and causes a cache miss (e.g. due to an error). The re-execution of the operation would then be blocked as Graphcache considered it a "reexecution loop" rather than a legitimate execution triggered by the UI. (See https://github.com/urql-graphql/urql/pull/2737 for more information), by [@kitten](https://github.com/kitten) (See [#2876](https://github.com/urql-graphql/urql/pull/2876))

## 5.0.7

### Patch Changes

- ⚠️ Fix type-generation, with a change in TS/Rollup the type generation took the paths as src and resolved them into the types dir, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2870](https://github.com/urql-graphql/urql/pull/2870))
- Updated dependencies (See [#2872](https://github.com/urql-graphql/urql/pull/2872), [#2870](https://github.com/urql-graphql/urql/pull/2870), and [#2871](https://github.com/urql-graphql/urql/pull/2871))
  - @urql/core@3.1.1

## 5.0.6

### Patch Changes

- Solve issue where partial data could cause loops between related queries, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2831](https://github.com/urql-graphql/urql/pull/2831))
- Add skipping of garbage collection runs when the cache is waiting for optimistic, deferred or other results in layers. This means that we only take an opportunity to run garbage collection after results have settled and are hence decreasing the chance of hogging the event loop when a run isn't needed, by [@kitten](https://github.com/kitten) (See [#2862](https://github.com/urql-graphql/urql/pull/2862))
- ⚠️ Fix a deadlock condition in Graphcache's layers, which is caused by subscriptions (or other deferred layers) starting before one-off mutation layers. This causes the mutation to not be completed, which keeps its data preferred above the deferred layer. That in turn means that layers stop squashing, which causes new results to be missing indefinitely, when they overlap, by [@kitten](https://github.com/kitten) (See [#2861](https://github.com/urql-graphql/urql/pull/2861))
- Updated dependencies (See [#2843](https://github.com/urql-graphql/urql/pull/2843), [#2847](https://github.com/urql-graphql/urql/pull/2847), [#2850](https://github.com/urql-graphql/urql/pull/2850), and [#2846](https://github.com/urql-graphql/urql/pull/2846))
  - @urql/core@3.1.0

## 5.0.5

### Patch Changes

- Set operations when updating the cache with a result, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2782](https://github.com/FormidableLabs/urql/pull/2782))

## 5.0.4

### Patch Changes

- Ensure we aren't eagerly removing layers that are caused by subscriptions, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2771](https://github.com/FormidableLabs/urql/pull/2771))

## 5.0.3

### Patch Changes

- ⚠️ Fix case where a mutation would also be counted in the loop-protection, this prevented partial queries from initiating refetches, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2761](https://github.com/FormidableLabs/urql/pull/2761))
- Updated dependencies (See [#2758](https://github.com/FormidableLabs/urql/pull/2758) and [#2762](https://github.com/FormidableLabs/urql/pull/2762))
  - @urql/core@3.0.5

## 5.0.2

### Patch Changes

- Preserve the original `DocumentNode` AST when updating the cache, to prevent results after a network request from differing and breaking referential equality due to added `__typename` fields, by [@kitten](https://github.com/kitten) (See [#2736](https://github.com/FormidableLabs/urql/pull/2736))
- ⚠️ Fix optimistic mutations containing partial results (`undefined` fields), which previously actually caused a hidden cache miss, which may then affect a subsequent non-optimistic mutation result, by [@kitten](https://github.com/kitten) (See [#2740](https://github.com/FormidableLabs/urql/pull/2740))
- Prevent cache misses from causing infinite network requests from being issued, when two operations manipulate each other while experiencing cache misses or are partially uncacheable, by [@kitten](https://github.com/kitten) (See [#2737](https://github.com/FormidableLabs/urql/pull/2737))
- ⚠️ Fix operation identities preventing users from deeply cloning operation contexts. Instead, we now use a client-wide counter (rolling over as needed).
  While this changes an internal data structure in `@urql/core` only, this change also affects the `offlineExchange` in `@urql/exchange-graphcache` due to it relying on the identity being previously an object rather than an integer, by [@kitten](https://github.com/kitten) (See [#2732](https://github.com/FormidableLabs/urql/pull/2732))
- ⚠️ Fix referential equality preservation in Graphcache failing after API results, due to a typo writing the API result rather than the updated cache result, by [@kitten](https://github.com/kitten) (See [#2741](https://github.com/FormidableLabs/urql/pull/2741))
- Updated dependencies (See [#2691](https://github.com/FormidableLabs/urql/pull/2691), [#2692](https://github.com/FormidableLabs/urql/pull/2692), and [#2732](https://github.com/FormidableLabs/urql/pull/2732))
  - @urql/core@3.0.4

## 5.0.1

### Patch Changes

- Adjust timing of when an introspected schema will be processed into field maps, interface maps, and union type maps. By making this lazy we can avoid excessive work when these maps aren't actually ever used, by [@kitten](https://github.com/kitten) (See [#2640](https://github.com/FormidableLabs/urql/pull/2640))

## 5.0.0

### Major Changes

- **Goodbye IE11!** 👋 This major release removes support for IE11. All code that is shipped will be transpiled much less and will _not_ be ES5-compatible anymore, by [@kitten](https://github.com/kitten) (See [#2504](https://github.com/FormidableLabs/urql/pull/2504))
- Prevent cache-hydration from buffering operations, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2612](https://github.com/FormidableLabs/urql/pull/2612))
- Implement stricter variables types, which require variables to always be passed and match TypeScript types when the generic is set or inferred. This is a breaking change for TypeScript users potentially, unless all types are adhered to, by [@kitten](https://github.com/kitten) (See [#2607](https://github.com/FormidableLabs/urql/pull/2607))
- Upgrade to [Wonka v6](https://github.com/0no-co/wonka) (`wonka@^6.0.0`), which has no breaking changes but is built to target ES2015 and comes with other minor improvements.
  The library has fully been migrated to TypeScript which will hopefully help with making contributions easier!, by [@kitten](https://github.com/kitten) (See [#2504](https://github.com/FormidableLabs/urql/pull/2504))

### Minor Changes

- Remove the `babel-plugin-modular-graphql` helper, this because the graphql package hasn't converted to ESM yet which gives issues in node environments, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2551](https://github.com/FormidableLabs/urql/pull/2551))
- Allow passing in `fragmentName` for `write` and `read` operations, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2609](https://github.com/FormidableLabs/urql/pull/2609))

### Patch Changes

- Graphcache's `optimistic` option now accepts optimistic mutation resolvers that return fields by
  name rather than alias. Previously, depending on which mutation was run, the optimistic resolvers
  would read your optimistic data by field alias (i.e. "alias" for `alias: id` rather than "id").
  Instead, optimistic updates now correctly use field names and allow you to also pass resolvers as
  values on your optimistic config, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2616](https://github.com/FormidableLabs/urql/pull/2616))
- Updated dependencies (See [#2551](https://github.com/FormidableLabs/urql/pull/2551), [#2504](https://github.com/FormidableLabs/urql/pull/2504), [#2619](https://github.com/FormidableLabs/urql/pull/2619), [#2607](https://github.com/FormidableLabs/urql/pull/2607), and [#2504](https://github.com/FormidableLabs/urql/pull/2504))
  - @urql/core@3.0.0

## 4.4.3

### Patch Changes

- Correctly reorder optimistic layers when we see repeated keys coming in, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2489](https://github.com/FormidableLabs/urql/pull/2489))

## 4.4.2

### Patch Changes

- Keep track of mutations in the offline exchange so we can accurately recreate the original variables, there could be more variables for use in updater functions which we strip away in graphCache before sending to the API, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2472](https://github.com/FormidableLabs/urql/pull/2472))

## 4.4.1

### Patch Changes

- Switch `isFragmentHeuristicallyMatching()` to always return `true` for writes, so that we give every fragment a chance to be applied and to write to the cache, by [@kitten](https://github.com/kitten) (See [#2455](https://github.com/FormidableLabs/urql/pull/2455))
- ⚠️ Fix default storage persisting data after `clear()` was called on it, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2458](https://github.com/FormidableLabs/urql/pull/2458))
- Updated dependencies (See [#2446](https://github.com/FormidableLabs/urql/pull/2446), [#2456](https://github.com/FormidableLabs/urql/pull/2456), and [#2457](https://github.com/FormidableLabs/urql/pull/2457))
  - @urql/core@2.5.0

## 4.4.0

### Minor Changes

- Fix issues with continuously updating operations (i.e. subscriptions and `hasNext: true` queries) by shifting their layers in Graphcache behind those that are still awaiting a result. This causes continuous updates to not overwrite one-off query results while still keeping continuously updating operations at the highest possible layer, by [@kitten](https://github.com/kitten) (See [#2419](https://github.com/FormidableLabs/urql/pull/2419))

### Patch Changes

- ⚠️ Fix ignore empty relay edges when using the `relayPagination` resolver, by [@tgriesser](https://github.com/tgriesser) (See [#2431](https://github.com/FormidableLabs/urql/pull/2431))
- Prevent creating unnecessary layers, which should improve performance slightly, by [@kitten](https://github.com/kitten) (See [#2419](https://github.com/FormidableLabs/urql/pull/2419))

## 4.3.6

### Patch Changes

- Extend peer dependency range of `graphql` to include `^16.0.0`.
  As always when upgrading across many packages of `urql`, especially including `@urql/core` we recommend you to deduplicate dependencies after upgrading, using `npm dedupe` or `npx yarn-deduplicate`, by [@kitten](https://github.com/kitten) (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
- Updated dependencies (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
  - @urql/core@2.3.6

## 4.3.5

### Patch Changes

- ⚠️ Fix regression from [#1869](https://github.com/FormidableLabs/urql/pull/1869) that caused nullable lists to always cause a cache miss, if schema awareness is enabled, by [@kitten](https://github.com/kitten) (See [#1983](https://github.com/FormidableLabs/urql/pull/1983))
- Updated dependencies (See [#1985](https://github.com/FormidableLabs/urql/pull/1985))
  - @urql/core@2.3.3

## 4.3.4

### Patch Changes

- Improve perf by using String.indexOf in getField, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1957](https://github.com/FormidableLabs/urql/pull/1957))
- Updated dependencies (See [#1944](https://github.com/FormidableLabs/urql/pull/1944))
  - @urql/core@2.3.2

## 4.3.3

### Patch Changes

- Remove `hasNext: true` flag from stale responses. This was erroneously added in debugging, but leads to stale responses being marked with `hasNext`, which means the `dedupExchange` will keep waiting for further network responses, by [@kitten](https://github.com/kitten) (See [#1911](https://github.com/FormidableLabs/urql/pull/1911))

## 4.3.2

### Patch Changes

- Cleanup the previous `onOnline` event-listener when called again, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1896](https://github.com/FormidableLabs/urql/pull/1896))

## 4.3.1

### Patch Changes

- ⚠️ Fix previous results' `null` values spilling into the next result that Graphcache issues, which may prevent updates from being issued until the query is reexecuted. This was affecting any `null` links on data, and any queries that were issued before non-optimistic mutations, by [@kitten](https://github.com/kitten) (See [#1885](https://github.com/FormidableLabs/urql/pull/1885))
- Updated dependencies (See [#1870](https://github.com/FormidableLabs/urql/pull/1870) and [#1880](https://github.com/FormidableLabs/urql/pull/1880))
  - @urql/core@2.3.1

## 4.3.0

### Minor Changes

- Improve referential equality of deeply queried objects from the normalised cache for queries. Each query operation will now reuse the last known result and only incrementally change references as necessary, scanning over the previous result to identify whether anything has changed.
  This should help improve the performance of processing updates in UI frameworks (e.g. in React with `useMemo` or `React.memo`). (See [#1859](https://github.com/FormidableLabs/urql/pull/1859))
- Add **experimental** support for `@defer` and `@stream` responses for GraphQL. This implements the ["GraphQL Defer and Stream Directives"](https://github.com/graphql/graphql-spec/blob/4fd39e0/rfcs/DeferStream.md) and ["Incremental Delivery over HTTP"](https://github.com/graphql/graphql-over-http/blob/290b0e2/rfcs/IncrementalDelivery.md) specifications. If a GraphQL API supports `multipart/mixed` responses for deferred and streamed delivery of GraphQL results, `@urql/core` (and all its derived fetch implementations) will attempt to stream results. This is _only supported_ on browsers [supporting streamed fetch responses](https://developer.mozilla.org/en-US/docs/Web/API/Response/body), which excludes IE11.
  The implementation of streamed multipart responses is derived from [`meros` by `@maraisr`](https://github.com/maraisr/meros), and is subject to change if the RFCs end up changing, by [@kitten](https://github.com/kitten) (See [#1854](https://github.com/FormidableLabs/urql/pull/1854))

### Patch Changes

- ⚠️ Fix missing values cascading into lists causing a `null` item without the query being marked as stale and fetched from the API. This would happen in schema awareness when a required field, which isn't cached, cascades into a nullable list, by [@kitten](https://github.com/kitten) (See [#1869](https://github.com/FormidableLabs/urql/pull/1869))
- Updated dependencies (See [#1854](https://github.com/FormidableLabs/urql/pull/1854))
  - @urql/core@2.3.0

## 4.2.1

### Patch Changes

- ⚠️ Fix issue where operations that get dispatched synchronously after the cache restoration completes get forgotten, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1789](https://github.com/FormidableLabs/urql/pull/1789))

## 4.2.0

### Minor Changes

- Fixed typing of OptimisticMutationResolver, by [@taneba](https://github.com/taneba) (See [#1765](https://github.com/FormidableLabs/urql/pull/1765))

### Patch Changes

- Type the `relayPagination` and `simplePagination` helpers return value as `Resolver<any, any, any>` as there's no way to match them consistently to either generated or non-generated resolver types anymore, by [@kitten](https://github.com/kitten) (See [#1778](https://github.com/FormidableLabs/urql/pull/1778))
- Updated dependencies (See [#1776](https://github.com/FormidableLabs/urql/pull/1776) and [#1755](https://github.com/FormidableLabs/urql/pull/1755))
  - @urql/core@2.1.5

## 4.1.4

### Patch Changes

- Apply [`bivarianceHack`](https://stackoverflow.com/questions/52667959/what-is-the-purpose-of-bivariancehack-in-typescript-types) in the `graphcache` types to better support code-generated configs, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1687](https://github.com/FormidableLabs/urql/pull/1687))
- Updated dependencies (See [#1709](https://github.com/FormidableLabs/urql/pull/1709))
  - @urql/core@2.1.4

## 4.1.3

### Patch Changes

- ⚠️ Fix: add the `ENTRIES_STORE_NAME` to the clear transaction, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1685](https://github.com/FormidableLabs/urql/pull/1685))
- Updated dependencies (See [#1695](https://github.com/FormidableLabs/urql/pull/1695))
  - @urql/core@2.1.3

## 4.1.2

### Patch Changes

- Loosen type constraint on `ScalarObject` to account for custom scalar deserialization like `Date` for `DateTime`s, by [@kitten](https://github.com/kitten) (See [#1648](https://github.com/FormidableLabs/urql/pull/1648))
- Loosen the typing constraint on the cacheExchange generic, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1675](https://github.com/FormidableLabs/urql/pull/1675))

## 4.1.1

### Patch Changes

- ⚠️ Fix an edge-case for which an introspection query during runtime could fail when schema-awareness was enabled in Graphcache, since built-in types weren't recognised as existent, by [@kitten](https://github.com/kitten) (See [#1631](https://github.com/FormidableLabs/urql/pull/1631))

## 4.1.0

### Minor Changes

- Add `cache.link(...)` method to Graphcache. This method may be used in updaters to update links in the cache. It is hence the writing-equivalent of `cache.resolve()`, which previously didn't have any equivalent as such, which meant that only `cache.updateQuery` or `cache.writeFragment` could be used, even to update simple relations, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1551](https://github.com/FormidableLabs/urql/pull/1551))
- Add on a generic to `cacheExchange` and `offlineExchange` for future, experimental type-generation support, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1562](https://github.com/FormidableLabs/urql/pull/1562))

### Patch Changes

- ⚠️ Fix up internal types in Graphcache to improve their accuracy for catching more edge cases in its implementation. This only affects you if you previously imported any type related to `ScalarObject` from Graphcache which now is a more opaque type. We've also adjusted the `NullArray` types to be potentially nested, since lists in GraphQL can be nested arbitarily, which we were covering but didn't reflect in our types, by [@kitten](https://github.com/kitten) (See [#1591](https://github.com/FormidableLabs/urql/pull/1591))
- Remove closure-compiler from the build step (See [#1570](https://github.com/FormidableLabs/urql/pull/1570))
- ⚠️ Fix list items being returned as `null` even for non-nullable lists, when the entities are missing in the cache. This could happen when a resolver was added returning entities or their keys. This behaviour is now (correctly) only applied to partial results with schema awareness, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1566](https://github.com/FormidableLabs/urql/pull/1566))
- Allow for the schema subscription and mutationType to be null, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1530](https://github.com/FormidableLabs/urql/pull/1530))
- Updated dependencies (See [#1570](https://github.com/FormidableLabs/urql/pull/1570), [#1509](https://github.com/FormidableLabs/urql/pull/1509), [#1600](https://github.com/FormidableLabs/urql/pull/1600), and [#1515](https://github.com/FormidableLabs/urql/pull/1515))
  - @urql/core@2.1.0

## 4.0.0

### Major Changes

- Add improved error awareness to Graphcache. When Graphcache now receives a `GraphQLError` (via a `CombinedError`) it checks whether the `GraphQLError`'s `path` matches up with `null` values in the `data`. Any `null` values that the write operation now sees in the data will be replaced with a "cache miss" value (i.e. `undefined`) when it has an associated error. This means that errored fields from your GraphQL API will be marked as uncached and won't be cached. Instead the client will now attempt a refetch of the data so that errors aren't preventing future refetches or with schema awareness it will attempt a refetch automatically. Additionally, the `updates` functions will now be able to check whether the current field has any errors associated with it with `info.error`, by [@kitten](https://github.com/kitten) (See [#1356](https://github.com/FormidableLabs/urql/pull/1356))

### Minor Changes

- Allow `schema` option to be passed with a partial introspection result that only contains `queryType`, `mutationType`, and `subscriptionType` with their respective names. This allows you to pass `{ __schema: { queryType: { name: 'Query' } } }` and the likes to Graphcache's `cacheExchange` to alter the default root names without enabling full schema awareness, by [@kitten](https://github.com/kitten) (See [#1379](https://github.com/FormidableLabs/urql/pull/1379))

### Patch Changes

- Updated dependencies (See [#1374](https://github.com/FormidableLabs/urql/pull/1374), [#1357](https://github.com/FormidableLabs/urql/pull/1357), and [#1375](https://github.com/FormidableLabs/urql/pull/1375))
  - @urql/core@2.0.0

## 3.4.0

### Minor Changes

- Warn when using an interface or union field in the graphCache resolvers config, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1304](https://github.com/FormidableLabs/urql/pull/1304))

### Patch Changes

- ⚠️ Fix edge-case where query results would pick up invalidated fields from mutation results as they're written to the cache. This would cause invalid cache misses although the result was expected to just be passed through from the API result, by [@kitten](https://github.com/kitten) (See [#1300](https://github.com/FormidableLabs/urql/pull/1300))
- ⚠️ Fix a Relay Pagination edge case where overlapping ends of pages queried using the `last` argument would be in reverse order, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1311](https://github.com/FormidableLabs/urql/pull/1311))

## 3.3.4

### Patch Changes

- ⚠️ Fix, add null as a possible type for the variables argument in `cache.invalidate`, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1269](https://github.com/FormidableLabs/urql/pull/1269))

## 3.3.3

### Patch Changes

- Update `cache.resolve(parent, ...)` case to enable _even more_ cases, for instance where `parent.__typename` isn't set yet. This was intended to be enabled in the previous patch but has been forgotten, by [@kitten](https://github.com/kitten) (See [#1219](https://github.com/FormidableLabs/urql/pull/1219))
- Deprecate `cache.resolveFieldByKey` in favour of `cache.resolve`, which functionally was already able to do the same, by [@kitten](https://github.com/kitten) (See [#1219](https://github.com/FormidableLabs/urql/pull/1219))
- Updated dependencies (See [#1225](https://github.com/FormidableLabs/urql/pull/1225))
  - @urql/core@1.16.1

## 3.3.2

### Patch Changes

- Update `cache` methods, for instance `cache.resolve`, to consistently accept the `parent` argument from `resolvers` and `updates` and alias it to the parent's key (which is usually found on `info.parentKey`). This usage of `cache.resolve(parent, ...)` was intuitive and is now supported as expected, by [@kitten](https://github.com/kitten) (See [#1208](https://github.com/FormidableLabs/urql/pull/1208))

## 3.3.1

### Patch Changes

- ⚠️ Fix reusing original query data from APIs accidentally, which can lead to subtle mismatches in results when the API's incoming `query` results are being updated by the `cacheExchange`, to apply resolvers. Specifically this may lead to relations from being set back to `null` when the resolver returns a different list of links than the result, since some `null` relations may unintentionally exist but aren't related. If you're using `relayPagination` then this fix is critical, by [@kitten](https://github.com/kitten) (See [#1196](https://github.com/FormidableLabs/urql/pull/1196))

## 3.3.0

### Minor Changes

- Increase the consistency of when and how the `__typename` field is added to results. Instead of
  adding it by default and automatically first, the `__typename` field will now be added along with
  the usual selection set. The `write` operation now automatically issues a warning if `__typename`
  isn't present where it's expected more often, which helps in debugging. Also the `__typename` field
  may now not proactively be added to root results, e.g. `"Query"`, by [@kitten](https://github.com/kitten) (See [#1185](https://github.com/FormidableLabs/urql/pull/1185))

### Patch Changes

- Replace `graphql/utilities/buildClientSchema.mjs` with a custom-tailored, lighter implementation
  built into `@urql/exchange-graphcache`. This will appear to increase its size by about `0.2kB gzip`
  but will actually save around `8.5kB gzip` to `9.4kB gzip` in any production bundle by using less of
  `graphql`'s code, by [@kitten](https://github.com/kitten) (See [#1189](https://github.com/FormidableLabs/urql/pull/1189))
- Updated dependencies (See [#1187](https://github.com/FormidableLabs/urql/pull/1187), [#1186](https://github.com/FormidableLabs/urql/pull/1186), and [#1186](https://github.com/FormidableLabs/urql/pull/1186))
  - @urql/core@1.16.0

## 3.2.0

### Minor Changes

- Add a `mergeMode: 'before' | 'after'` option to the `simplePagination` helper to define whether pages are merged before or after preceding ones when pagination, similar to `relayPagination`'s option, by [@hoangvvo](https://github.com/hoangvvo) (See [#1174](https://github.com/FormidableLabs/urql/pull/1174))

### Patch Changes

- Updated dependencies (See [#1168](https://github.com/FormidableLabs/urql/pull/1168))
  - @urql/core@1.15.2

## 3.1.11

### Patch Changes

- Add support for `TypedDocumentNode` to infer the type of the `OperationResult` and `Operation` for all methods, functions, and hooks that either directly or indirectly accept a `DocumentNode`. See [`graphql-typed-document-node` and the corresponding blog post for more information.](https://github.com/dotansimha/graphql-typed-document-node), by [@kitten](https://github.com/kitten) (See [#1113](https://github.com/FormidableLabs/urql/pull/1113))
- Updated dependencies (See [#1119](https://github.com/FormidableLabs/urql/pull/1119), [#1113](https://github.com/FormidableLabs/urql/pull/1113), [#1104](https://github.com/FormidableLabs/urql/pull/1104), and [#1123](https://github.com/FormidableLabs/urql/pull/1123))
  - @urql/core@1.15.0

## 3.1.10

### Patch Changes

- ⚠️ Fix a stray `operationName` deprecation warning in `@urql/exchange-graphcache`'s exchange logic, which adds the `meta.cacheOutcome` field to the operation's context, by [@kitten](https://github.com/kitten) (See [#1103](https://github.com/FormidableLabs/urql/pull/1103))

## 3.1.9

### Patch Changes

- ⚠️ Fix the production build overwriting the development build. Specifically in the previous release we mistakenly replaced all development bundles with production bundles. This doesn't have any direct influence on how these packages work, but prevented development warnings from being logged or full errors from being thrown, by [@kitten](https://github.com/kitten) (See [#1097](https://github.com/FormidableLabs/urql/pull/1097))
- Updated dependencies (See [#1097](https://github.com/FormidableLabs/urql/pull/1097))
  - @urql/core@1.14.1

## 3.1.8

### Patch Changes

- Add missing `.mjs` extension to all imports from `graphql` to fix Webpack 5 builds, which require extension-specific import paths for ESM bundles and packages. **This change allows you to safely upgrade to Webpack 5.**, by [@kitten](https://github.com/kitten) (See [#1094](https://github.com/FormidableLabs/urql/pull/1094))
- Deprecate the `Operation.operationName` property in favor of `Operation.kind`. This name was
  previously confusing as `operationName` was effectively referring to two different things. You can
  safely upgrade to this new version, however to mute all deprecation warnings you will have to
  **upgrade** all `urql` packages you use. If you have custom exchanges that spread operations, please
  use [the new `makeOperation` helper
  function](https://formidable.com/open-source/urql/docs/api/core/#makeoperation) instead, by [@bkonkle](https://github.com/bkonkle) (See [#1045](https://github.com/FormidableLabs/urql/pull/1045))
- Updated dependencies (See [#1094](https://github.com/FormidableLabs/urql/pull/1094) and [#1045](https://github.com/FormidableLabs/urql/pull/1045))
  - @urql/core@1.14.0

## 3.1.7

### Patch Changes

- Enforce atomic optimistic updates so that optimistic layers are cleared before they're reapplied. This is important for instance when an optimistic update is performed while offline and then reapplied while online, which would previously repeat the optimistic update on top of its past data changes, by [@kitten](https://github.com/kitten) (See [#1080](https://github.com/FormidableLabs/urql/pull/1080))

## 3.1.6

### Patch Changes

- ⚠️ Fix optimistic updates not being allowed to be cumulative and apply on top of each other. Previously in [#866](https://github.com/FormidableLabs/urql/pull/866) we explicitly deemed this as unsafe which isn't correct anymore given that concrete, non-optimistic updates are now never applied on top of optimistic layers, by [@kitten](https://github.com/kitten) (See [#1074](https://github.com/FormidableLabs/urql/pull/1074))

## 3.1.5

### Patch Changes

- Changes some internals of how selections are iterated over and remove some private exports. This will have no effect or fixes on how Graphcache functions, but may improve some minor performance characteristics of large queries, by [@kitten](https://github.com/kitten) (See [#1060](https://github.com/FormidableLabs/urql/pull/1060))

## 3.1.4

### Patch Changes

- ⚠️ Fix inline fragments being skipped when they were missing a full type condition as per the GraphQL spec (e.g `{ ... { field } }`), by [@kitten](https://github.com/kitten) (See [#1040](https://github.com/FormidableLabs/urql/pull/1040))

## 3.1.3

### Patch Changes

- ⚠️ Fix a case where the `offlineExchange` would not start processing operations after hydrating persisted data when no operations arrived in time by the time the persisted data was restored. This would be more evident in Preact and Svelte due to their internal short timings, by [@kitten](https://github.com/kitten) (See [#1019](https://github.com/FormidableLabs/urql/pull/1019))

## 3.1.2

### Patch Changes

- ⚠️ Fix small pieces of code where polyfill-less ES5 usage was compromised. This was unlikely to have affected anyone in production as `Array.prototype.find` (the only usage of an ES6 method) is commonly used and polyfilled, by [@kitten](https://github.com/kitten) (See [#991](https://github.com/FormidableLabs/urql/pull/991))
- ⚠️ Fix queries that have erroed with a `NetworkError` (`isOfflineError`) not flowing back completely through the `cacheExchange`.
  These queries should also now be reexecuted when the client comes back online, by [@kitten](https://github.com/kitten) (See [#1011](https://github.com/FormidableLabs/urql/pull/1011))
- Updated dependencies (See [#1011](https://github.com/FormidableLabs/urql/pull/1011))
  - @urql/core@1.13.1

## 3.1.1

### Patch Changes

- ⚠️ Fix updaters config not working when Mutation/Subscription root names were altered.
  For instance, a Mutation named `mutation_root` could cause `store.updates` to be misread and cause a
  runtime error, by [@kitten](https://github.com/kitten) (See [#984](https://github.com/FormidableLabs/urql/pull/984))
- ⚠️ Fix operation results being obstructed by the `offlineExchange` when the network request has failed due to being offline and no cache result has been issued. Instead the `offlineExchange` will now retry with `cache-only` policy, by [@kitten](https://github.com/kitten) (See [#985](https://github.com/FormidableLabs/urql/pull/985))

## 3.1.0

### Minor Changes

- Add support for `nodes` fields to the `relayPagination` helper, instead of only supporting the standard `edges`. (See [#897](https://github.com/FormidableLabs/urql/pull/897))

### Patch Changes

- Updated dependencies (See [#947](https://github.com/FormidableLabs/urql/pull/947), [#962](https://github.com/FormidableLabs/urql/pull/962), and [#957](https://github.com/FormidableLabs/urql/pull/957))
  - @urql/core@1.13.0

## 3.0.2

### Patch Changes

- Add special-case for fetching an introspection result in our schema-checking, this avoids an error when urql-devtools fetches the backend graphql schema, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#893](https://github.com/FormidableLabs/urql/pull/893))
- Mute warning when using built-in GraphQL fields, like `__type`, by [@kitten](https://github.com/kitten) (See [#919](https://github.com/FormidableLabs/urql/pull/919))
- ⚠️ Fix return type for resolvers to allow data objects to be returned with `__typename` as expected, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#927](https://github.com/FormidableLabs/urql/pull/927))
- Updated dependencies (See [#911](https://github.com/FormidableLabs/urql/pull/911) and [#908](https://github.com/FormidableLabs/urql/pull/908))
  - @urql/core@1.12.3

## 3.0.1

### Patch Changes

- Add warning for queries that traverse an Operation Root Type (Mutation / Subscription types occuring in a query result), by [@kitten](https://github.com/kitten) (See [#859](https://github.com/FormidableLabs/urql/pull/859))
- ⚠️ Fix storage implementation not preserving deleted values correctly or erroneously checking optimistically written entries for changes. This is fixed by adding a new default serializer to the `@urql/exchange-graphcache/default-storage` implementation, which will be incompatible with the old one, by [@kitten](https://github.com/kitten) (See [#866](https://github.com/FormidableLabs/urql/pull/866))
- Replace unnecessary `scheduleTask` polyfill with inline `Promise.resolve().then(fn)` calls, by [@kitten](https://github.com/kitten) (See [#861](https://github.com/FormidableLabs/urql/pull/861))
- Updated dependencies (See [#860](https://github.com/FormidableLabs/urql/pull/860) and [#861](https://github.com/FormidableLabs/urql/pull/861))
  - @urql/core@1.12.1

## 3.0.0

This major release comes with a couple of fixes and new **experimental offline support**, which
we're very excited for! Please give it a try if your application is targeting Offline First!

To migrate to this new major version, check the major breaking changes below. Mainly you will have
to watch out for `cache.invalidateQuery` which has been removed. Instead you should now invalidate
individual entities and fields using `cache.invalidate`. [Learn more about this method on our
docs.](https://formidable.com/open-source/urql/docs/graphcache/custom-updates/#cacheinvalidate)

### Major Changes

- Remove the deprecated `populateExchange` export from `@urql/exchange-graphcache`.
  If you're using the `populateExchange`, please install the separate `@urql/exchange-populate` package and import it from there, by [@kitten](https://github.com/kitten) (See [#840](https://github.com/FormidableLabs/urql/pull/840))
- The deprecated `cache.invalidateQuery()` method has been removed. Please migrate over to `cache.invalidate()` instead, which operates on individual fields instead of queries, by [@kitten](https://github.com/kitten) (See [#840](https://github.com/FormidableLabs/urql/pull/840))

### Minor Changes

- Implement experimental Offline Support in Graphcache.
  [Read more about how to use the Offline Support in our docs.](https://formidable.com/open-source/urql/docs/graphcache/offline/), by [@kitten](https://github.com/kitten) (See [#793](https://github.com/FormidableLabs/urql/pull/793))
- Issue warnings when an unknown type or field has been included in Graphcache's `opts` configuration to help spot typos.
  Checks `opts.keys`, `opts.updates`, `opts.resolvers` and `opts.optimistic`. (See [#820](https://github.com/FormidableLabs/urql/pull/820) and [#826](https://github.com/FormidableLabs/urql/pull/826))

### Patch Changes

- ⚠️ Fix resolvers being executed for data even when data is currently written. This behaviour could lead to interference with custom updaters that update fragments or queries, e.g. an updater that was receiving paginated data due to a pagination resolver. We've determined that generally it is undesirable to have any resolvers run during the cache update (writing) process, since it may lead to resolver data being accidentally written to the cache or for resolvers to interfere with custom user updates, by [@olistic](https://github.com/olistic) (See [#812](https://github.com/FormidableLabs/urql/pull/812))
- Upgrade to a minimum version of wonka@^4.0.14 to work around issues with React Native's minification builds, which use uglify-es and could lead to broken bundles, by [@kitten](https://github.com/kitten) (See [#842](https://github.com/FormidableLabs/urql/pull/842))
- Updated dependencies (See [#838](https://github.com/FormidableLabs/urql/pull/838) and [#842](https://github.com/FormidableLabs/urql/pull/842))
  - @urql/core@1.12.0

## 2.4.2

### Patch Changes

- Add `source` debug name to all `dispatchDebug` calls during build time to identify events by which exchange dispatched them, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#780](https://github.com/FormidableLabs/urql/pull/780))
- ⚠️ Fix Introspection Queries (or internal types in general) triggering lots of warnings for unkeyed entities, by [@kitten](https://github.com/kitten) (See [#779](https://github.com/FormidableLabs/urql/pull/779))
- Updated dependencies (See [#780](https://github.com/FormidableLabs/urql/pull/780))
  - @urql/core@1.11.7

## 2.4.1

### Patch Changes

- Add a `"./package.json"` entry to the `package.json`'s `"exports"` field for Node 14. This seems to be required by packages like `rollup-plugin-svelte` to function properly, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#771](https://github.com/FormidableLabs/urql/pull/771))
- ⚠️ Fix traversal issue, where when a prior selection set has set a nested result field to `null`, a subsequent traversal of this field attempts to access `prevData` on `null`, by [@kitten](https://github.com/kitten) (See [#772](https://github.com/FormidableLabs/urql/pull/772))
- Updated dependencies (See [#771](https://github.com/FormidableLabs/urql/pull/771) and [#771](https://github.com/FormidableLabs/urql/pull/771))
  - @urql/exchange-populate@0.1.7
  - @urql/core@1.11.6

## 2.4.0

This release heavily improves on the intuitiveness of how Optimistic Updates work. It ensures that
optimistic updates aren't accidentally discarded, by temporarily blocking some refetches when
necessary. It also prevents optimistic mutation updates from becoming permanent, which could
previously happen if an updater read optimistic data and rewrote it again. This isn't possible
anymore as mutation results are applied as a batch.

### Minor Changes

- Implement refetch blocking for queries that are affected by optimistic update. When a query would normally be refetched, either because it was partial or a cache-and-network operation, we now wait if it touched optimistic data for that optimistic mutation to complete. This prevents optimistic update data from unexpectedly disappearing, by [@kitten](https://github.com/kitten) (See [#750](https://github.com/FormidableLabs/urql/pull/750))
- Implement optimistic mutation result flushing. Mutation results for mutation that have had optimistic updates will now wait for all optimistic mutations to complete at the same time before being applied to the cache. This sometimes does delay cache updates to until after multiple mutations have completed, but it does prevent optimistic data from being accidentally committed permanently, which is more intuitive, by [@kitten](https://github.com/kitten) (See [#750](https://github.com/FormidableLabs/urql/pull/750))

### Patch Changes

- Adjust mutation results priority to always override query results as they arrive, similarly to subscriptions. This will prevent race conditions when mutations are slow to execute at the cost of some consistency, by [@kitten](https://github.com/kitten) (See [#745](https://github.com/FormidableLabs/urql/pull/745))
- Improve warning and error console output in development by cleaning up the GraphQL trace stack, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#751](https://github.com/FormidableLabs/urql/pull/751))

## 2.3.8

### Patch Changes

Sorry for the many updates; Please only upgrade to `>=2.3.8` and don't use the deprecated `2.3.7`
and `2.3.6` release.

- ⚠️ Fix nested package path for @urql/core/internal and @urql/exchange-graphcache/extras, by [@kitten](https://github.com/kitten) (See [#734](https://github.com/FormidableLabs/urql/pull/734))
- Updated dependencies (See [#734](https://github.com/FormidableLabs/urql/pull/734))
  - @urql/core@1.11.4

## 2.3.7

### Patch Changes

- Make the extension of the main export unknown, which fixes a Webpack issue where the resolver won't pick `module` fields in `package.json` files once it's importing from another `.mjs` file, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#733](https://github.com/FormidableLabs/urql/pull/733))
- Updated dependencies (See [#733](https://github.com/FormidableLabs/urql/pull/733))
  - @urql/core@1.11.2

## 2.3.5

### Patch Changes

- ⚠️ Fix data persistence for embedded fields, by [@kitten](https://github.com/kitten) (See [#727](https://github.com/FormidableLabs/urql/pull/727))

## 2.3.4

### Patch Changes

- Add debugging events to exchanges that add more detailed information on what is happening
  internally, which will be displayed by devtools like the urql [Chrome / Firefox extension](https://github.com/FormidableLabs/urql-devtools), by [@andyrichardson](https://github.com/andyrichardson) (See [#608](https://github.com/FormidableLabs/urql/pull/608))
- ⚠️ Fix persistence using special tab character in serialized keys and add sanitization to persistence key serializer, by [@kitten](https://github.com/kitten) (See [#715](https://github.com/FormidableLabs/urql/pull/715))
- Updated dependencies (See [#608](https://github.com/FormidableLabs/urql/pull/608), [#718](https://github.com/FormidableLabs/urql/pull/718), and [#722](https://github.com/FormidableLabs/urql/pull/722))
  - @urql/core@1.11.0

## 2.3.3

### Patch Changes

- ⚠️ Fix @urql/exchange-populate visitWithTypeInfo import by bumping babel-plugin-modular-graphql, by [@kitten](https://github.com/kitten) (See [#709](https://github.com/FormidableLabs/urql/pull/709))
- Updated dependencies (See [#709](https://github.com/FormidableLabs/urql/pull/709))
  - @urql/exchange-populate@0.1.6

## 2.3.2

### Patch Changes

- Pick modules from graphql package, instead of importing from graphql/index.mjs, by [@kitten](https://github.com/kitten) (See [#700](https://github.com/FormidableLabs/urql/pull/700))
- Change invalidation to check for undefined links since null is a valid value in graphql, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#694](https://github.com/FormidableLabs/urql/pull/694))
- Updated dependencies (See [#700](https://github.com/FormidableLabs/urql/pull/700))
  - @urql/exchange-populate@0.1.5
  - @urql/core@1.10.9

## 2.3.1

### Patch Changes

- Add graphql@^15.0.0 to peer dependency range, by [@kitten](https://github.com/kitten) (See [#688](https://github.com/FormidableLabs/urql/pull/688))
- Forcefully bump @urql/core package in all bindings and in @urql/exchange-graphcache.
  We're aware that in some cases users may not have upgraded to @urql/core, even though that's within
  the typical patch range. Since the latest @urql/core version contains a patch that is required for
  `cache-and-network` to work, we're pushing another patch that now forcefully bumps everyone to the
  new version that includes this fix, by [@kitten](https://github.com/kitten) (See [#684](https://github.com/FormidableLabs/urql/pull/684))
- Reimplement persistence support to take commutative layers into account, by [@kitten](https://github.com/kitten) (See [#674](https://github.com/FormidableLabs/urql/pull/674))
- Updated dependencies (See [#688](https://github.com/FormidableLabs/urql/pull/688) and [#678](https://github.com/FormidableLabs/urql/pull/678))
  - @urql/exchange-populate@0.1.4
  - @urql/core@1.10.8

## 2.3.0

### Minor Changes

- Support optimistic values for mutations without a selectionset, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#657](https://github.com/FormidableLabs/urql/pull/657))

### Patch Changes

- Refactor to replace dictionary-based (`Object.create(null)`) results with regular objects, by [@kitten](https://github.com/kitten) (See [#651](https://github.com/FormidableLabs/urql/pull/651))
- ⚠️ Fix case where a mutation-rootfield would cause an empty call to the cache.updates[mutationRootField], by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#654](https://github.com/FormidableLabs/urql/pull/654))
- Updated dependencies (See [#658](https://github.com/FormidableLabs/urql/pull/658) and [#650](https://github.com/FormidableLabs/urql/pull/650))
  - @urql/core@1.10.5

## 2.2.8

### Patch Changes

- ⚠️ Fix node resolution when using Webpack, which experiences a bug where it only resolves
  `package.json:main` instead of `module` when an `.mjs` file imports a package, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#642](https://github.com/FormidableLabs/urql/pull/642))
- Updated dependencies (See [#642](https://github.com/FormidableLabs/urql/pull/642))
  - @urql/exchange-populate@0.1.3
  - @urql/core@1.10.4

## 2.2.7

### Patch Changes

- ⚠️ Fix critical ordering bug in commutative queries and mutations. Subscriptions and queries would ad-hoc be receiving an empty optimistic layer accidentally. This leads to subscription results potentially being cleared, queries from being erased on a second write, and layers from sticking around on every second write or indefinitely. This affects versions `> 2.2.2` so please upgrade!, by [@kitten](https://github.com/kitten) (See [#638](https://github.com/FormidableLabs/urql/pull/638))
- ⚠️ Fix multipart conversion, in the `extract-files` dependency (used by multipart-fetch) there is an explicit check for the constructor property of an object. This made the files unretrievable, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#639](https://github.com/FormidableLabs/urql/pull/639))
- ⚠️ Fix Node.js Module support for v13 (experimental-modules) and v14. If your bundler doesn't support
  `.mjs` files and fails to resolve the new version, please double check your configuration for
  Webpack, or similar tools, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#637](https://github.com/FormidableLabs/urql/pull/637))
- Updated dependencies (See [#637](https://github.com/FormidableLabs/urql/pull/637))
  - @urql/exchange-populate@0.1.2
  - @urql/core@1.10.3

## 2.2.6

### Patch Changes

- ⚠️ Fix cache.inspectFields causing an undefined error for uninitialised or cleared commutative layers, by [@kitten](https://github.com/kitten) (See [#626](https://github.com/FormidableLabs/urql/pull/626))
- Improve Store constructor to accept an options object instead of separate arguments, identical to the cacheExchange options. (This is a patch, not a minor, since we consider Store part of the private API), by [@kitten](https://github.com/kitten) (See [#622](https://github.com/FormidableLabs/urql/pull/622))
- Allow a single field to be invalidated using cache.invalidate using two additional arguments, similar to store.resolve; This is a very small addition, so it's marked as a patch, by [@kitten](https://github.com/kitten) (See [#627](https://github.com/FormidableLabs/urql/pull/627))
- Prevent variables from being filtered and queries from being altered before they're forwarded, which prevented additional untyped variables from being used inside updater functions, by [@kitten](https://github.com/kitten) (See [#629](https://github.com/FormidableLabs/urql/pull/629))
- Expose generated result data on writeOptimistic and passthrough data on write operations, by [@kitten](https://github.com/kitten) (See [#613](https://github.com/FormidableLabs/urql/pull/613))
- Updated dependencies (See [#621](https://github.com/FormidableLabs/urql/pull/621))
  - @urql/core@1.10.2

## 2.2.5

### Patch Changes

- Refactor parts of Graphcache for a minor performance boost and bundlesize reductions, by [@kitten](https://github.com/kitten) (See [#611](https://github.com/FormidableLabs/urql/pull/611))

## 2.2.4

### Patch Changes

- ⚠️ Fix Rollup bundle output being written to .es.js instead of .esm.js, by [@kitten](https://github.com/kitten) (See [#609](https://github.com/FormidableLabs/urql/pull/609))
- Updated dependencies (See [#609](https://github.com/FormidableLabs/urql/pull/609))
  - @urql/core@1.10.1

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

- ✨ Implement `populateExchange` (see [#120](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/120))
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
- Invariant and warnings will now have an error code associated with a more elaborate explanation (see [#99](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/99))
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
