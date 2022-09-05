# urql

## 3.0.3

### Patch Changes

- ⚠️ Fix `fetching` going to `false` after changing variables in a subscription, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2667](https://github.com/FormidableLabs/urql/pull/2667))

## 3.0.2

### Patch Changes

- Update generics for components, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2663](https://github.com/FormidableLabs/urql/pull/2663))
- Updated dependencies (See [#2665](https://github.com/FormidableLabs/urql/pull/2665))
  - @urql/core@3.0.3

## 3.0.1

### Patch Changes

- Tweak the variables type for when generics only contain nullable keys, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2623](https://github.com/FormidableLabs/urql/pull/2623))

## 3.0.0

### Major Changes

- **Goodbye IE11!** 👋 This major release removes support for IE11. All code that is shipped will be transpiled much less and will _not_ be ES5-compatible anymore, by [@kitten](https://github.com/kitten) (See [#2504](https://github.com/FormidableLabs/urql/pull/2504))
- Implement stricter variables types, which require variables to always be passed and match TypeScript types when the generic is set or inferred. This is a breaking change for TypeScript users potentially, unless all types are adhered to, by [@kitten](https://github.com/kitten) (See [#2607](https://github.com/FormidableLabs/urql/pull/2607))
- Upgrade to [Wonka v6](https://github.com/0no-co/wonka) (`wonka@^6.0.0`), which has no breaking changes but is built to target ES2015 and comes with other minor improvements.
  The library has fully been migrated to TypeScript which will hopefully help with making contributions easier!, by [@kitten](https://github.com/kitten) (See [#2504](https://github.com/FormidableLabs/urql/pull/2504))

### Patch Changes

- Updated dependencies (See [#2551](https://github.com/FormidableLabs/urql/pull/2551), [#2504](https://github.com/FormidableLabs/urql/pull/2504), [#2619](https://github.com/FormidableLabs/urql/pull/2619), [#2607](https://github.com/FormidableLabs/urql/pull/2607), and [#2504](https://github.com/FormidableLabs/urql/pull/2504))
  - @urql/core@3.0.0

## 2.2.3

### Patch Changes

- ⚠️ Fix missing React updates after an incoming response that schedules a mount. We now prevent dispatched operations from continuing to flush synchronously when the original source that runs the queue has terminated. This is important for the React bindings, because an update (e.g. `setState`) may recursively schedule a mount, which then disabled other `setState` updates from being processed. Previously we assumed that React used a trampoline scheduler for updates, however it appears that `setState` can recursively start more React work, by [@kitten](https://github.com/kitten) (See [#2556](https://github.com/FormidableLabs/urql/pull/2556))
- Updated dependencies (See [#2556](https://github.com/FormidableLabs/urql/pull/2556))
  - @urql/core@2.6.1

## 2.2.2

### Patch Changes

- ⚠️ Fix Node.js ESM re-export detection for `@urql/core` in `urql` package and CommonJS output for all other CommonJS-first packages. This ensures that Node.js' `cjs-module-lexer` can correctly identify re-exports and report them properly. Otherwise, this will lead to a runtime error, by [@kitten](https://github.com/kitten) (See [#2485](https://github.com/FormidableLabs/urql/pull/2485))

## 2.2.1

### Patch Changes

- ⚠️ Fix issue where a paused subscription would execute with stale variables, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2463](https://github.com/FormidableLabs/urql/pull/2463))

## 2.2.0

### Minor Changes

- Revert to the previous `useQuery` implementation, `use-sync-external-store` seems to be causing some unexpected timing issues, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2308](https://github.com/FormidableLabs/urql/pull/2308))

### Patch Changes

- Updated dependencies (See [#2295](https://github.com/FormidableLabs/urql/pull/2295))
  - @urql/core@2.4.3

## 2.1.3

### Patch Changes

- ⚠️ fix diff data correctly for the next state computing, this avoids having UI-flashes due to undefined data, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2238](https://github.com/FormidableLabs/urql/pull/2238))
- ⚠️ fix issue where the cache infinitely loops, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2237](https://github.com/FormidableLabs/urql/pull/2237))

## 2.1.2

### Patch Changes

- Update `useQuery` implementation to avoid an aborted render on initial mount. We abort a render-on-update once when the state needs to be updated according to the `OperationResult` source we need to listen to and execute. However, we can avoid this on the initial mount as we've done in a prior version. This fix **does not** change any of the current behaviour, but simply avoids the confusing state transition on mount, by [@kitten](https://github.com/kitten) (See [#2227](https://github.com/FormidableLabs/urql/pull/2227))
- Updated dependencies (See [#2228](https://github.com/FormidableLabs/urql/pull/2228))
  - @urql/core@2.4.1

## 2.1.1

### Patch Changes

- pin version for `use-sync-external-store`, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2223](https://github.com/FormidableLabs/urql/pull/2223))

## 2.1.0

### Minor Changes

- Leverage the new `use-sync-external-store` package and `useSyncExternalStore` hook in `useQuery` implementation to bring the state synchronisation in React in line with React v18. While the current implementation works already with React Suspense and React Concurrent this will reduce the maintenance burden of our implementation and ensure certain guarantees so that React doesn't break us, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2164](https://github.com/FormidableLabs/urql/pull/2164))

### Patch Changes

- ⚠️ Fix `useMutation` not working correctly with React 18, by [@Dremora](https://github.com/Dremora) (See [#2158](https://github.com/FormidableLabs/urql/pull/2158))
- Updated dependencies (See [#2189](https://github.com/FormidableLabs/urql/pull/2189), [#2153](https://github.com/FormidableLabs/urql/pull/2153), [#2210](https://github.com/FormidableLabs/urql/pull/2210), and [#2198](https://github.com/FormidableLabs/urql/pull/2198))
  - @urql/core@2.4.0

## 2.0.6

### Patch Changes

- Extend peer dependency range of `graphql` to include `^16.0.0`.
  As always when upgrading across many packages of `urql`, especially including `@urql/core` we recommend you to deduplicate dependencies after upgrading, using `npm dedupe` or `npx yarn-deduplicate`, by [@kitten](https://github.com/kitten) (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
- Updated dependencies (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
  - @urql/core@2.3.6

## 2.0.5

### Patch Changes

- ⚠️ Fix issue where a paused query would not behave correctly when calling `executeQuery`, this scenario occured when the query has variables, there would be cases where on the first call it would think that the dependencies had changed (previous request vs current request) which made the source reset to null, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1982](https://github.com/FormidableLabs/urql/pull/1982))
- Updated dependencies (See [#1944](https://github.com/FormidableLabs/urql/pull/1944))
  - @urql/core@2.3.2

## 2.0.4

### Patch Changes

- ⚠️ Fix issue with `useQuery`'s `executeQuery` state updates, where some calls wouldn't trigger a source change and start a request when the hook was paused, by [@kitten](https://github.com/kitten) (See [#1722](https://github.com/FormidableLabs/urql/pull/1722))
- Updated dependencies (See [#1709](https://github.com/FormidableLabs/urql/pull/1709))
  - @urql/core@2.1.4

## 2.0.3

### Patch Changes

- Remove closure-compiler from the build step (See [#1570](https://github.com/FormidableLabs/urql/pull/1570))
- Updated dependencies (See [#1570](https://github.com/FormidableLabs/urql/pull/1570), [#1509](https://github.com/FormidableLabs/urql/pull/1509), [#1600](https://github.com/FormidableLabs/urql/pull/1600), and [#1515](https://github.com/FormidableLabs/urql/pull/1515))
  - @urql/core@2.1.0

## 2.0.2

### Patch Changes

- Add a displayName to the Provider, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1431](https://github.com/FormidableLabs/urql/pull/1431))

## 2.0.1

### Patch Changes

- ⚠️ Fix issue where `useSubscription` would endlessly loop when the callback wasn't memoized, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1384](https://github.com/FormidableLabs/urql/pull/1384))
- ⚠️ Fix case where identical `useQuery` calls would result in cross-component updates, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1383](https://github.com/FormidableLabs/urql/pull/1383))

## 2.0.0

### Major Changes

- **Breaking**: Remove `pollInterval` option from `useQuery`. Instead please consider using `useEffect` calling `executeQuery` on an interval, by [@kitten](https://github.com/kitten) (See [#1374](https://github.com/FormidableLabs/urql/pull/1374))

### Minor Changes

- Reimplement `useQuery` to apply a consistent Suspense cache (torn down queries will still eliminate stale values) and support all Concurrent Mode edge cases. This work is based on `useMutableSource`'s mechanisms and allows React to properly fork lanes since no implicit state exists outside of `useState` in the implementation. The `useSubscription` hook has been updated similarly without a cache or retrieving values on mount, by [@kitten](https://github.com/kitten) (See [#1335](https://github.com/FormidableLabs/urql/pull/1335))
- Remove deprecated `operationName` property from `Operation`s. The new `Operation.kind` property is now preferred. If you're creating new operations you may also use the `makeOperation` utility instead.
  When upgrading `@urql/core` please ensure that your package manager didn't install any duplicates of it. You may deduplicate it manually using `npx yarn-deduplicate` (for Yarn) or `npm dedupe` (for npm), by [@kitten](https://github.com/kitten) (See [#1357](https://github.com/FormidableLabs/urql/pull/1357))

### Patch Changes

- Updated dependencies (See [#1374](https://github.com/FormidableLabs/urql/pull/1374), [#1357](https://github.com/FormidableLabs/urql/pull/1357), and [#1375](https://github.com/FormidableLabs/urql/pull/1375))
  - @urql/core@2.0.0

## 1.11.6

### Patch Changes

- ⚠️ Fix edge cases related to Suspense triggering on an update in Concurrent Mode. Previously it was possible for stale state to be preserved across the Suspense update instead of the new state showing up. This has been fixed by preventing the suspending query source from closing prematurely, by [@kitten](https://github.com/kitten) (See [#1308](https://github.com/FormidableLabs/urql/pull/1308))

## 1.11.5

### Patch Changes

- ⚠️ Fix Suspense when results share data, this would return partial results for graphCache and not update to the eventual data, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1282](https://github.com/FormidableLabs/urql/pull/1282))

## 1.11.4

### Patch Changes

- Add a built-in `gql` tag function helper to `@urql/core`. This behaves similarly to `graphql-tag` but only warns about _locally_ duplicated fragment names rather than globally. It also primes `@urql/core`'s key cache with the parsed `DocumentNode`, by [@kitten](https://github.com/kitten) (See [#1187](https://github.com/FormidableLabs/urql/pull/1187))
- Add `suspense: false` to options when `executeQuery` is called explicitly, by [@kitten](https://github.com/kitten) (See [#1181](https://github.com/FormidableLabs/urql/pull/1181))
- Updated dependencies (See [#1187](https://github.com/FormidableLabs/urql/pull/1187), [#1186](https://github.com/FormidableLabs/urql/pull/1186), and [#1186](https://github.com/FormidableLabs/urql/pull/1186))
  - @urql/core@1.16.0

## 1.11.3

### Patch Changes

- ⚠️ Fix in edge-case in client-side React Suspense, where after suspending due to an update a new state value is given to `useSource` in a render update. This was previously then causing us to subscribe to an outdated source in `useEffect` since the updated source would be ignored by the time we reach `useEffect` in `useSource`, by [@kitten](https://github.com/kitten) (See [#1157](https://github.com/FormidableLabs/urql/pull/1157))

## 1.11.2

### Patch Changes

- ⚠️ Fix regression in client-side Suspense behaviour. This has been fixed in `urql@1.11.0` and `@urql/preact@1.4.0` but regressed in the patches afterwards that were aimed at fixing server-side Suspense, by [@kitten](https://github.com/kitten) (See [#1142](https://github.com/FormidableLabs/urql/pull/1142))

## 1.11.1

### Patch Changes

- ⚠️ Fix server-side rendering by disabling the new Suspense cache on the server-side and clear it for prepasses, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1138](https://github.com/FormidableLabs/urql/pull/1138))
- Updated dependencies (See [#1135](https://github.com/FormidableLabs/urql/pull/1135))
  - @urql/core@1.15.1

## 1.11.0

### Minor Changes

- Improve the Suspense implementation, which fixes edge-cases when Suspense is used with subscriptions, partially disabled, or _used on the client-side_. It has now been ensured that client-side suspense functions without the deprecated `suspenseExchange` and uncached results are loaded consistently. As part of this work, the `Client` itself does now never throw Suspense promises anymore, which is functionality that either way has no place outside of the React/Preact bindings, by [@kitten](https://github.com/kitten) (See [#1123](https://github.com/FormidableLabs/urql/pull/1123))

### Patch Changes

- Add support for `TypedDocumentNode` to infer the type of the `OperationResult` and `Operation` for all methods, functions, and hooks that either directly or indirectly accept a `DocumentNode`. See [`graphql-typed-document-node` and the corresponding blog post for more information.](https://github.com/dotansimha/graphql-typed-document-node), by [@kitten](https://github.com/kitten) (See [#1113](https://github.com/FormidableLabs/urql/pull/1113))
- Refactor `useSource` hooks which powers `useQuery` and `useSubscription` to improve various edge case behaviour. This will not change the behaviour of these hooks dramatically but avoid unnecessary state updates when any updates are obviously equivalent and the hook will furthermore improve continuation from mount to effects, which will fix cases where the state between the mounting and effect phase may slightly change, by [@kitten](https://github.com/kitten) (See [#1104](https://github.com/FormidableLabs/urql/pull/1104))
- Updated dependencies (See [#1119](https://github.com/FormidableLabs/urql/pull/1119), [#1113](https://github.com/FormidableLabs/urql/pull/1113), [#1104](https://github.com/FormidableLabs/urql/pull/1104), and [#1123](https://github.com/FormidableLabs/urql/pull/1123))
  - @urql/core@1.15.0

## 1.10.3

### Patch Changes

- ⚠️ Fix the production build overwriting the development build. Specifically in the previous release we mistakenly replaced all development bundles with production bundles. This doesn't have any direct influence on how these packages work, but prevented development warnings from being logged or full errors from being thrown, by [@kitten](https://github.com/kitten) (See [#1097](https://github.com/FormidableLabs/urql/pull/1097))
- Updated dependencies (See [#1097](https://github.com/FormidableLabs/urql/pull/1097))
  - @urql/core@1.14.1

## 1.10.2

### Patch Changes

- Deprecate the `Operation.operationName` property in favor of `Operation.kind`. This name was
  previously confusing as `operationName` was effectively referring to two different things. You can
  safely upgrade to this new version, however to mute all deprecation warnings you will have to
  **upgrade** all `urql` packages you use. If you have custom exchanges that spread operations, please
  use [the new `makeOperation` helper
  function](https://formidable.com/open-source/urql/docs/api/core/#makeoperation) instead, by [@bkonkle](https://github.com/bkonkle) (See [#1045](https://github.com/FormidableLabs/urql/pull/1045))
- Updated dependencies (See [#1094](https://github.com/FormidableLabs/urql/pull/1094) and [#1045](https://github.com/FormidableLabs/urql/pull/1045))
  - @urql/core@1.14.0

## 1.10.1

### Patch Changes

- ⚠️ Fix React Fast Refresh beng broken due to an invalid effect, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#969](https://github.com/FormidableLabs/urql/pull/969))

## 1.10.0

### Minor Changes

- Add the operation to the query, mutation and subscription result, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#924](https://github.com/FormidableLabs/urql/pull/924))

### Patch Changes

- Update hooks to be exported functions rather than exported block-scoped variables to provide TypeScript consumers with better access to their signature, by [@dotansimha](https://github.com/dotansimha) (See [#904](https://github.com/FormidableLabs/urql/pull/904))
- Updated dependencies (See [#911](https://github.com/FormidableLabs/urql/pull/911) and [#908](https://github.com/FormidableLabs/urql/pull/908))
  - @urql/core@1.12.3

## 1.9.8

### Patch Changes

- Upgrade to a minimum version of wonka@^4.0.14 to work around issues with React Native's minification builds, which use uglify-es and could lead to broken bundles, by [@kitten](https://github.com/kitten) (See [#842](https://github.com/FormidableLabs/urql/pull/842))
- Updated dependencies (See [#838](https://github.com/FormidableLabs/urql/pull/838) and [#842](https://github.com/FormidableLabs/urql/pull/842))
  - @urql/core@1.12.0

## 1.9.7

### Patch Changes

- Bump @urql/core to ensure exchanges have dispatchDebug, this could formerly result in a crash, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#726](https://github.com/FormidableLabs/urql/pull/726))

## 1.9.6

### Patch Changes

- Add graphql@^15.0.0 to peer dependency range, by [@kitten](https://github.com/kitten) (See [#688](https://github.com/FormidableLabs/urql/pull/688))
- Forcefully bump @urql/core package in all bindings and in @urql/exchange-graphcache.
  We're aware that in some cases users may not have upgraded to @urql/core, even though that's within
  the typical patch range. Since the latest @urql/core version contains a patch that is required for
  `cache-and-network` to work, we're pushing another patch that now forcefully bumps everyone to the
  new version that includes this fix, by [@kitten](https://github.com/kitten) (See [#684](https://github.com/FormidableLabs/urql/pull/684))
- Updated dependencies (See [#688](https://github.com/FormidableLabs/urql/pull/688) and [#678](https://github.com/FormidableLabs/urql/pull/678))
  - @urql/core@1.10.8

## 1.9.5

### Patch Changes

- Avoid setting state on an unmounted component when useMutation is used, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#656](https://github.com/FormidableLabs/urql/pull/656))
- Updated dependencies (See [#658](https://github.com/FormidableLabs/urql/pull/658) and [#650](https://github.com/FormidableLabs/urql/pull/650))
  - @urql/core@1.10.5

## 1.9.4

### Patch Changes

- ⚠️ Fix bundling for packages depending on React, as it doesn't have native ESM bundles, by [@kitten](https://github.com/kitten) (See [#646](https://github.com/FormidableLabs/urql/pull/646))

## 1.9.3

### Patch Changes

- ⚠️ Fix node resolution when using Webpack, which experiences a bug where it only resolves
  `package.json:main` instead of `module` when an `.mjs` file imports a package, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#642](https://github.com/FormidableLabs/urql/pull/642))
- Updated dependencies (See [#642](https://github.com/FormidableLabs/urql/pull/642))
  - @urql/core@1.10.4

## 1.9.2

### Patch Changes

- ⚠️ Fix Node.js Module support for v13 (experimental-modules) and v14. If your bundler doesn't support
  `.mjs` files and fails to resolve the new version, please double check your configuration for
  Webpack, or similar tools, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#637](https://github.com/FormidableLabs/urql/pull/637))
- Updated dependencies (See [#637](https://github.com/FormidableLabs/urql/pull/637))
  - @urql/core@1.10.3

## 1.9.1

### Patch Changes

- Bumps the `@urql/core` dependency minor version to ^1.10.1 for React, Preact and Svelte, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#623](https://github.com/FormidableLabs/urql/pull/623))
- Avoid React v16.13.0's "Warning: Cannot update a component" by preventing cross-hook updates during render or initial mount, by [@kitten](https://github.com/kitten) (See [#630](https://github.com/FormidableLabs/urql/pull/630))
- Updated dependencies (See [#621](https://github.com/FormidableLabs/urql/pull/621))
  - @urql/core@1.10.2

## 1.9.0

### Patch Changes

- ⚠️ Fix more concurrent-mode and strict-mode edge cases and bugs by switching to useSubscription. (See [#514](https://github.com/FormidableLabs/urql/pull/514))
- ⚠️ Fix client-side suspense support (as minimally as possible) by altering
  the useBehaviourSubject behaviour. (See [#512](https://github.com/FormidableLabs/urql/pull/521))
- Updated dependencies (See [#533](https://github.com/FormidableLabs/urql/pull/533), [#519](https://github.com/FormidableLabs/urql/pull/519), [#515](https://github.com/FormidableLabs/urql/pull/515), [#512](https://github.com/FormidableLabs/urql/pull/512), and [#518](https://github.com/FormidableLabs/urql/pull/518))
  - @urql/core@1.9.0

## 1.8.2

This patch fixes client-side suspense. While we wouldn't recommend its use
anymore, since suspense lends itself to prerendering instead of a loading
primitive, we'd like to ensure that suspense-mode works as expected in `urql`.

Also, as mentioned in `v1.8.0`'s notes, please ensure that `urql` upgrades to
use `wonka@^4.0.7` to avoid any issues. If your bundler or packager uses a
lower version with `urql`, you will see runtime errors.

- Clean up unnecessary `useMemo` for `useCallback` in hooks (see [#504](https://github.com/FormidableLabs/urql/pull/504))
- Fix synchronous, client-side suspense and simplify `toSuspenseSource` helper (see [#506](https://github.com/FormidableLabs/urql/pull/506))

## 1.8.1

This patch fixes `urql` relying on a quirk in older versions of `wonka` where
shared sources wouldn't cascade cancellations, which they now do. This meant
that when an app goes from some queries/subscriptions to having none at all,
the exchange pipeline would be stopped completely.

- Fix exchange pipeline stalling when all queries end (see [#503](https://github.com/FormidableLabs/urql/pull/503))

## 1.8.0

This release doesn't change any major feature aspects, but comes with bugfixes
to our suspense and concurrent-mode handling. Due to an upgrade to `wonka@^4.0.0`
this is a minor version though.

In [v1.6.0](https://github.com/FormidableLabs/urql/blob/main/CHANGELOG.md#160) we believed to
have solved all issues related to suspense and concurrent mode. However there were
still some remaining cases where concurrent mode behaved incorrectly. With the new
`useOperator` hook in [`react-wonka@2.0.0`](https://github.com/kitten/react-wonka) we believe
to have now fixed all issues.

The initial mount of `useQuery` and `useSubscription` will now synchronously reflect
whatever `urql` returns, most of the times those will be cached results. Afterwards
all subsequent updates and fetches will be scheduled cooperatively with React on
an effect.

If you're using `wonka` for an exchange with `urql` you may want to upgrade to `wonka@^4.0.5` soon.
You can still use the older `v3.2.2` which will work with the new version (even in the same bundle),
unless you're making use of its `subscribe`, `make`, or `makeSubject` exports.
[A migration guide can be found in the `wonka` docs.](https://wonka.kitten.sh/migration)

- Support concurrent mode with all edge cases fully (see [#496](https://github.com/FormidableLabs/urql/pull/496))
- Move to `react-wonka@2.0.0` with the prior fix in #496 (see [#499](https://github.com/FormidableLabs/urql/pull/499))

## 1.7.0

This release splits our main package into two entrypoints. Importing from `urql` remains
unchanged, but internally this entrypoint uses `urql/core`, which doesn't contain any
React-related code. If you're building framework-agnostic libraries or apps without
React, you can now use `urql/core` directly.

- Fix `originalError` on `GraphQLError` instances (see [#470](https://github.com/FormidableLabs/urql/pull/470))
- Fix `stringifyVariables` not using `.toJSON()` which prevented Dates from being stringified, by [@BjoernRave](https://github.com/BjoernRave) (see [#485](https://github.com/FormidableLabs/urql/pull/485))
- Expose `urql/core` without any React code included (see [#424](https://github.com/FormidableLabs/urql/pull/424))

## 1.6.3

- Fix suspense-mode being erroneously activated when using `client.query()` (see [#466](https://github.com/FormidableLabs/react-ssr-prepass/pull/21))

## 1.6.2

This fixes a potentially critical bug, where a component would enter an infinite rerender loop,
when another hook triggers an update. This may happen when multiple `useQuery` hooks are used in
a single component or when another state hook triggers a synchronous update.

- Add generic type-parameter to `client.query` and `client.mutation`, by [@ctrlplusb](https://github.com/ctrlplusb) (see [#456](https://github.com/FormidableLabs/urql/pull/456))
- ⚠️ Fix `useQuery` entering an infinite loop during SSR when an update is triggered (see [#459](https://github.com/FormidableLabs/urql/pull/459))

## 1.6.1

- Fix hook updates not being propagated to potential context providers (see [#451](https://github.com/FormidableLabs/urql/pull/451))

## 1.6.0

This release comes with stability improvements for the `useQuery` and `useSubscription` hooks
when using suspense and concurrent mode. They should behave the same as before under normal
circumstances and continue to deliver the correct state on initial mount and updates.
The `useQuery` hook may however now trigger suspense updates when its inputs are changing,
as it should, instead of erroneously throwing a promise in `useEffect`.

The added `stale: boolean` flag on the hooks indicates whether a result is "stale".
`useQuery` will expose `stale: true` on results that are cached but will be updated
due to the use of `cache-and-network`.

We've also made some changes so that `client.query()` won't throw a promise, when suspense
mode is activated.

- ✨ Add `stale` flag to `OperationResult` and hook results (see [#449](https://github.com/FormidableLabs/urql/pull/449))
- Replace `useImmeditateEffect` and `useImmediateState` with `react-wonka` derived state and effect (see [#447](https://github.com/FormidableLabs/urql/pull/447))
- Add (internal) `suspense` flag to `OperationContext`

## 1.5.1

- Replace `fast-json-stable-stringify` with embedded code (see [#426](https://github.com/FormidableLabs/urql/pull/426))
- ⚠ Prevent caching `null` data (see [#437](https://github.com/FormidableLabs/urql/pull/437))

## 1.5.0

This release finally adds shortcuts to imperatively make queries and mutations.
They make it easier to quickly use the client programmatically, either with
a Wonka source-based or Promise-based call.

```js
// Call .query or .mutation which return Source<OperationResult>
const source = client.query(doc, vars);
const source = client.mutation(doc, vars);
// Call .toPromise() on the source to get Promise<OperationResult>
const promise = client.query(doc, vars).toPromise();
const promise = client.mutation(doc, vars).toPromise();
```

This version also adds a `useClient` hook as a shortcut for `useContext(Context)`.
We provide a default client that makes requests to `/graphql`. Since that has
confused users before, we now log a warning, when it's used.

- ✨ Implement `client.query()` and `client.mutation()` (see [#405](https://github.com/FormidableLabs/urql/pull/405))
- Fix `useImmediateEffect` for concurrent mode (see [#418](https://github.com/FormidableLabs/urql/pull/418))
- Deconstruct `Wonka.pipe` using a Babel transform (see [#419](https://github.com/FormidableLabs/urql/pull/419))
- ⚠ Add `useClient` hook and warning when default client is used (see [#420](https://github.com/FormidableLabs/urql/pull/420))

## 1.4.1

This release adds "active teardowns" for operations, which means that an exchange can now send a teardown to cancel ongoing operations. The `subscriptionsExchange` for instance now ends ongoing subscriptions proactively if the server says that they've completed! This is also reflected as `fetching: false` in the `useQuery` and `useSubscription` hook.

We've also fixed a small issue with suspense and added all features from `useQuery` to `useSubscription`! This includes the `pause` argument and an `executeSubscription` function.

- ✨ Implement active teardowns and add missing features to `useSubscription` (see [#410](https://github.com/FormidableLabs/urql/pull/410))
- Fix `UseMutationResponse` TypeScript type, by [@jbugman](https://github.com/jbugman) (see [#412](https://github.com/FormidableLabs/urql/pull/412))
- Exclude subscriptions from suspense source (see [#415](https://github.com/FormidableLabs/urql/pull/415))

## 1.4.0

This release removes all metadata for the `@urql/devtools` extension from the core
`urql` package. This data will now be generated internally in the devtools exchange
itself. [Please also upgrade to the latest `@urql/devtools` version if you're using
the extension.](https://github.com/FormidableLabs/urql-devtools/releases/tag/v0.0.3)

This release has mainly been focused on minor refactors to keep the bundlesize low.
But it also introduces new features, like specifying a default `requestPolicy` and
a new polling option on `useQuery`!

This release also exports `makeResult` and `makeErrorResult`, which will reduce the
boilerplate code that you need for custom fetch exchanges.

- Minor bundlesize optimizations and remove `debugExchange` in production (see [#375](https://github.com/FormidableLabs/urql/pull/375))
- ✨ Add `requestPolicy` option to `Client` to change the default request policy (see [#376](https://github.com/FormidableLabs/urql/pull/376))
- ⚠ Remove dependency on `graphql-tag` and improve `Operation.key` hashing (see [#383](https://github.com/FormidableLabs/urql/pull/383))
- Remove `networkLatency` and `source` metadata from context, and delete `useDevtoolsContext` (see [#387](https://github.com/FormidableLabs/urql/pull/387) and [#388](https://github.com/FormidableLabs/urql/pull/388))
- ✨ Add support for polling with `pollInterval` argument to `useQuery`, by [@mxstbr](https://github.com/mxstbr) (see [#397](https://github.com/FormidableLabs/urql/pull/397))
- ⚠ Prevent `__typename` from being added to the toplevel GraphQL documents (see [#399](https://github.com/FormidableLabs/urql/pull/399))
- Add `operationName` field to `fetch` request body (see [#401](https://github.com/FormidableLabs/urql/pull/401))

## 1.3.0

This release comes with some important fixes and enhancements, which all address
certain edge-cases when using `urql`.

It fixes the `cache-and-network` request policy, which wouldn't always work correctly and issue another network request after resolving a response from the default cache. We also had a major bug in React Native environments where responses wouldn't ever be reflected in the `useQuery` hook's state. Lastly, you can now use `extensions` from your GraphQL servers and modify the `OperationContext` from the hooks options.

- ✨ Add support for `extensions` key in GraphQL responses, by [@adamscybot](https://github.com/adamscybot) (see [#355](https://github.com/FormidableLabs/urql/pull/355))
- ⚠ Fix `cache-and-network` request policy by adding operation flushing to the client (see [#356](https://github.com/FormidableLabs/urql/pull/356))
- Add `fetch` option to the Client so it doesn't have to be polyfilled globally (see [#357](https://github.com/FormidableLabs/urql/pull/357) and [#359](https://github.com/FormidableLabs/urql/pull/359))
- ⚠ Fix `useImmediateState` for React Native environments (see [#358](https://github.com/FormidableLabs/urql/pull/358))
- ✨ Add `context` option to all hooks to allow `OperationContext` to be changed dynamically (see [#351](https://github.com/FormidableLabs/urql/pull/351))
- Add `isClient` option to `ssrExchange` in case `suspense` is activated on the client-side (see [#369](https://github.com/FormidableLabs/urql/pull/369))

## 1.2.0

A release focused on improving developer experience (in preparation for the
upcoming devtools) as well as minor documentation improvements and bug fixes.

- Add metadata to operation context in development (see [#305](https://github.com/FormidableLabs/urql/pull/305), [#324](https://github.com/FormidableLabs/urql/pull/324), [#325](https://github.com/FormidableLabs/urql/pull/325) and [#329](https://github.com/FormidableLabs/urql/pull/329))
- Fix minor typename memory leak (see [#321](https://github.com/FormidableLabs/urql/pull/321))
- Fix types for react subscription components (see [#328](https://github.com/FormidableLabs/urql/pull/328))
- Fix displayName attributes not populated in examples (see [#330](https://github.com/FormidableLabs/urql/pull/330))
- Fix error in `collectTypes` method (see [#343](https://github.com/FormidableLabs/urql/pull/343))
- Fix HTTP status bounds check error (see [#348](https://github.com/FormidableLabs/urql/pull/348/files))

## 1.1.3

This is a hotfix that patches a small regression from `1.1.2` where
`useQuery` would crash due to an incorrect teardown function from pause.

- Fix `executeQuery` dispose function when `pause` is set, by[@JoviDeCroock](https://github.com/JoviDeCroock) (see [#315](https://github.com/FormidableLabs/urql/pull/315))

## 1.1.2

This patch fixes a small bug that usually manifests in development,
where the initial state would be incorrect after a fast response from
the GraphQL API. This used to lock the state into `fetching: true`
indefinitely in some cases.

- Export all TS types for components (see [#312](https://github.com/FormidableLabs/urql/pull/312))
- ⚠️ Fix state getting stuck on initial mount for fast responses (see [#310](https://github.com/FormidableLabs/urql/pull/310))
- Refactor build tooling to be driven only by Rollup (see [#306](https://github.com/FormidableLabs/urql/pull/306))
- Remove dev-only dependencies from `dependencies` (see [#304](https://github.com/FormidableLabs/urql/pull/304))

## 1.1.1

This release comes with two small patches. One being a critical fix,
where cancelled requests would be erroneously deduped, which meant
a previously cancelled query would never be fetched.

It also refactors our bundling process to transpile `Object.assign` to
restore IE11 support and reduce the amount of duplicate helper in our bundles.

- ⚠️ Fix torn-down requests being deduped forever (see [#281](https://github.com/FormidableLabs/urql/pull/281))
- Fix `useQuery`'s `pause` argument blocking explicit `executeQuery` calls (see [#278](https://github.com/FormidableLabs/urql/pull/278))
- Add `Object.assign` transpilation for IE11 and refactor bundling (see [#274](https://github.com/FormidableLabs/urql/pull/274))

## 1.1.0

This release introduces support for **server-side rendering**.
You can find out more about it by reading
[the new Basics section on how to set it up.](https://github.com/FormidableLabs/urql/blob/master/docs/basics.md#server-side-rendering)

This version now also requires a version of React supporting hooks! (>= 16.8.0)
We unfortunately forgot to correct the `peerDependencies` entries in our v1.0.0 release.

- ✨ Add **server-side rendering** support (see [#268](https://github.com/FormidableLabs/urql/pull/268))
- ✨ Ensure that state changes are applied immediately on mount (see [#256](https://github.com/FormidableLabs/urql/pull/256))
- Ensure that effects are run immediately on mount (see [#250](https://github.com/FormidableLabs/urql/pull/250))
- ⚠️ Remove `create-react-context` and bump React peer dependency (see [#252](https://github.com/FormidableLabs/urql/pull/252))
- Add generics to the `Query`, `Mutation`, and `Subscription` components
- ⚠️ Fix issues where `useQuery` wouldn't update or teardown correctly (see [#243](https://github.com/FormidableLabs/urql/pull/243))
- ✨ Add support for `pause` prop/option to `useQuery` and `Query` (see [#237](https://github.com/FormidableLabs/urql/pull/237))

## 1.0.5

- Export `MutationProps` types for TS typings, by [@mxstbr](https://github.com/mxstbr) (see [#236](https://github.com/FormidableLabs/urql/pull/236))
- Export `Use*Args` types for TS typings, by [@mxstbr](https://github.com/mxstbr) (see [#235](https://github.com/FormidableLabs/urql/pull/235))
- Export all hook response types for TS typings, by [@good-idea](https://github.com/good-idea) (see [#233](https://github.com/FormidableLabs/urql/pull/233))
- ⚠ Fix runtime error in `cachExchange` where already deleted keys where being accessed (see [#223](https://github.com/FormidableLabs/urql/pull/223))
- ⚠️ Fix `cacheExchange` not forwarding teardowns correctly, which lead to unnecessary/outdated queries being executed, by [@federicobadini](https://github.com/federicobadini) (see [#222](https://github.com/FormidableLabs/urql/pull/222))
- Change `GraphQLRequest` to always pass on a parsed GraphQL `DocumentNode` instead of just a string, which reduces work (see [#221](https://github.com/FormidableLabs/urql/pull/221))
- Fix incorrect TS types by using `Omit<T, K>` (see [#220](https://github.com/FormidableLabs/urql/pull/220))

## 1.0.4

- Fix `__typename` not being extracted from responses correctly, which broke caching
- Fix `fetchOptions` being called in the client instead of the `fetchExchange`
- Improve `CombinedError` to actually extend `Error` and rehydrate `GraphQLError` instances
- Fix `executeMutation` prop not accepting any generics types

## 1.0.3

- Fix bug where `variables` were only compared using reference equality, leading to
  infinite rerenders

## 1.0.2

- Allow `graphql-tag` / `DocumentNode` usage; Operations' queries can now be `DocumentNode`s
- Generating keys for queries has been optimized

https://github.com/FormidableLabs/urql/compare/v1.0.4...v1.0.5

## 1.0.0

> Since the entire library has been rewritten for v1.0.0, no changes
> are listed here!

`urql` v1 is more customisable than ever with "Exchanges", which
allow you to change every aspect of how `urql` works.
