# @urql/vue

## 1.4.3

### Patch Changes

- Omit minified files and sourcemaps' `sourcesContent` in published packages
  Submitted by [@kitten](https://github.com/kitten) (See [#3755](https://github.com/urql-graphql/urql/pull/3755))
- Updated dependencies (See [#3755](https://github.com/urql-graphql/urql/pull/3755))
  - @urql/core@5.1.1

## 1.4.2

### Patch Changes

- Add type for `hasNext` to the query and mutation results
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3703](https://github.com/urql-graphql/urql/pull/3703))

## 1.4.1

### Patch Changes

- Use `shallowRef` for data variable to avoid extra overhead for heavy objects
  Submitted by [@yurks](https://github.com/yurks) (See [#3641](https://github.com/urql-graphql/urql/pull/3641))

## 1.4.0

### Minor Changes

- Refactor composable functions with a focus on avoiding memory leaks and Vue best practices
  Submitted by [@yurks](https://github.com/yurks) (See [#3619](https://github.com/urql-graphql/urql/pull/3619))

## 1.3.2

### Patch Changes

- ⚠️ Fix deep options reactivity for subscriptions
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3616](https://github.com/urql-graphql/urql/pull/3616))

## 1.3.1

### Patch Changes

- ⚠️ Fix variables losing reactivity
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3614](https://github.com/urql-graphql/urql/pull/3614))

## 1.3.0

### Minor Changes

- Use `shallowRef` to avoid creating deeply reactive objects for heavy objects
  Submitted by [@negezor](https://github.com/negezor) (See [#3611](https://github.com/urql-graphql/urql/pull/3611))
- Remove wrapping request `args` in `reactive` to fix memory leak
  Submitted by [@negezor](https://github.com/negezor) (See [#3612](https://github.com/urql-graphql/urql/pull/3612))

## 1.2.2

### Patch Changes

- ⚠️ Fix reactaive typings for `variables` (See [#3605](https://github.com/urql-graphql/urql/pull/3605))
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [`118d74b2`](https://github.com/urql-graphql/urql/commit/118d74b238007264cacfb91fc12de74370d5766e))
- Restore the possibility to use a getter for the pause property
  Submitted by [@arkandias](https://github.com/arkandias) (See [#3598](https://github.com/urql-graphql/urql/pull/3598))

## 1.2.1

### Patch Changes

- ⚠️ Fix regression causing `pause` argument on `useQuery` and `useSubscription` to not be reactive
  Submitted by [@arkandias](https://github.com/arkandias) (See [#3595](https://github.com/urql-graphql/urql/pull/3595))

## 1.2.0

### Minor Changes

- Mark `@urql/core` as a peer dependency as well as a regular dependency
  Submitted by [@kitten](https://github.com/kitten) (See [#3579](https://github.com/urql-graphql/urql/pull/3579))

### Patch Changes

- ⚠️ Fix subscription handlers to not receive `null` values
  Submitted by [@kitten](https://github.com/kitten) (See [#3581](https://github.com/urql-graphql/urql/pull/3581))
- Add missing support for getter functions as input arguments values to `useQuery`, `useSubscription`, and `useMutation`
  Submitted by [@kitten](https://github.com/kitten) (See [#3582](https://github.com/urql-graphql/urql/pull/3582))

## 1.1.3

### Patch Changes

- Updated dependencies (See [#3520](https://github.com/urql-graphql/urql/pull/3520), [#3553](https://github.com/urql-graphql/urql/pull/3553), and [#3520](https://github.com/urql-graphql/urql/pull/3520))
  - @urql/core@5.0.0

## 1.1.2

### Patch Changes

- Update build process to generate correct source maps
  Submitted by [@kitten](https://github.com/kitten) (See [#3201](https://github.com/urql-graphql/urql/pull/3201))
- Prevent multiple operations being executed in a row when multiple inputs change simultaneously (e.g. `isPaused` and query inputs)
  Submitted by [@kitten](https://github.com/kitten) (See [#3231](https://github.com/urql-graphql/urql/pull/3231))

## 1.1.1

### Patch Changes

- Publish with npm provenance
  Submitted by [@kitten](https://github.com/kitten) (See [#3180](https://github.com/urql-graphql/urql/pull/3180))

## 1.1.0

### Minor Changes

- Allow mutations to update their results in bindings when `hasNext: true` is set, which indicates deferred or streamed results
  Submitted by [@kitten](https://github.com/kitten) (See [#3103](https://github.com/urql-graphql/urql/pull/3103))

### Patch Changes

- ⚠️ Fix source maps included with recently published packages, which lost their `sourcesContent`, including additional source files, and had incorrect paths in some of them
  Submitted by [@kitten](https://github.com/kitten) (See [#3053](https://github.com/urql-graphql/urql/pull/3053))
- Upgrade to `wonka@^6.3.0`
  Submitted by [@kitten](https://github.com/kitten) (See [#3104](https://github.com/urql-graphql/urql/pull/3104))
- Add TSDocs to all `urql` bindings packages
  Submitted by [@kitten](https://github.com/kitten) (See [#3079](https://github.com/urql-graphql/urql/pull/3079))
- Updated dependencies (See [#3101](https://github.com/urql-graphql/urql/pull/3101), [#3033](https://github.com/urql-graphql/urql/pull/3033), [#3054](https://github.com/urql-graphql/urql/pull/3054), [#3053](https://github.com/urql-graphql/urql/pull/3053), [#3060](https://github.com/urql-graphql/urql/pull/3060), [#3081](https://github.com/urql-graphql/urql/pull/3081), [#3039](https://github.com/urql-graphql/urql/pull/3039), [#3104](https://github.com/urql-graphql/urql/pull/3104), [#3082](https://github.com/urql-graphql/urql/pull/3082), [#3097](https://github.com/urql-graphql/urql/pull/3097), [#3061](https://github.com/urql-graphql/urql/pull/3061), [#3055](https://github.com/urql-graphql/urql/pull/3055), [#3085](https://github.com/urql-graphql/urql/pull/3085), [#3079](https://github.com/urql-graphql/urql/pull/3079), [#3087](https://github.com/urql-graphql/urql/pull/3087), [#3059](https://github.com/urql-graphql/urql/pull/3059), [#3055](https://github.com/urql-graphql/urql/pull/3055), [#3057](https://github.com/urql-graphql/urql/pull/3057), [#3050](https://github.com/urql-graphql/urql/pull/3050), [#3062](https://github.com/urql-graphql/urql/pull/3062), [#3051](https://github.com/urql-graphql/urql/pull/3051), [#3043](https://github.com/urql-graphql/urql/pull/3043), [#3063](https://github.com/urql-graphql/urql/pull/3063), [#3054](https://github.com/urql-graphql/urql/pull/3054), [#3102](https://github.com/urql-graphql/urql/pull/3102), [#3097](https://github.com/urql-graphql/urql/pull/3097), [#3106](https://github.com/urql-graphql/urql/pull/3106), [#3058](https://github.com/urql-graphql/urql/pull/3058), and [#3062](https://github.com/urql-graphql/urql/pull/3062))
  - @urql/core@4.0.0

## 1.0.5

### Patch Changes

- Allow a `Client` provided using `provideClient` to be used in the same component it's been provided in
  Submitted by [@kitten](https://github.com/kitten) (See [#3018](https://github.com/urql-graphql/urql/pull/3018))
- ⚠️ Fix type utilities turning the `variables` properties optional when a type from `TypedDocumentNode` has no `Variables` or all optional `Variables`. Previously this would break for wrappers, e.g. in code generators, or when the type didn't quite match what we'd expect
  Submitted by [@kitten](https://github.com/kitten) (See [#3022](https://github.com/urql-graphql/urql/pull/3022))
- Updated dependencies (See [#3007](https://github.com/urql-graphql/urql/pull/3007), [#2962](https://github.com/urql-graphql/urql/pull/2962), [#3007](https://github.com/urql-graphql/urql/pull/3007), [#3015](https://github.com/urql-graphql/urql/pull/3015), and [#3022](https://github.com/urql-graphql/urql/pull/3022))
  - @urql/core@3.2.0

## 1.0.4

### Patch Changes

- ⚠️ Fix type-generation, with a change in TS/Rollup the type generation took the paths as src and resolved them into the types dir, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2870](https://github.com/urql-graphql/urql/pull/2870))
- Updated dependencies (See [#2872](https://github.com/urql-graphql/urql/pull/2872), [#2870](https://github.com/urql-graphql/urql/pull/2870), and [#2871](https://github.com/urql-graphql/urql/pull/2871))
  - @urql/core@3.1.1

## 1.0.3

### Patch Changes

- Move remaining `Variables` generics over from `object` default to `Variables extends AnyVariables = AnyVariables`. This has been introduced previously in [#2607](https://github.com/urql-graphql/urql/pull/2607) but some missing ports have been missed due to TypeScript not catching them previously. Depending on your TypeScript version the `object` default is incompatible with `AnyVariables`, by [@kitten](https://github.com/kitten) (See [#2843](https://github.com/urql-graphql/urql/pull/2843))
- Updated dependencies (See [#2843](https://github.com/urql-graphql/urql/pull/2843), [#2847](https://github.com/urql-graphql/urql/pull/2847), [#2850](https://github.com/urql-graphql/urql/pull/2850), and [#2846](https://github.com/urql-graphql/urql/pull/2846))
  - @urql/core@3.1.0

## 1.0.2

### Patch Changes

- ⚠️ Fix an issue that caused `useQuery` to fail for promise-based access, if a result is delivered by the `Client` immediately, by [@kitten](https://github.com/kitten) (See [#2629](https://github.com/FormidableLabs/urql/pull/2629))

## 1.0.1

### Patch Changes

- Tweak the variables type for when generics only contain nullable keys, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2623](https://github.com/FormidableLabs/urql/pull/2623))

## 1.0.0

### Major Changes

- **Goodbye IE11!** 👋 This major release removes support for IE11. All code that is shipped will be transpiled much less and will _not_ be ES5-compatible anymore, by [@kitten](https://github.com/kitten) (See [#2504](https://github.com/FormidableLabs/urql/pull/2504))
- Implement stricter variables types, which require variables to always be passed and match TypeScript types when the generic is set or inferred. This is a breaking change for TypeScript users potentially, unless all types are adhered to, by [@kitten](https://github.com/kitten) (See [#2607](https://github.com/FormidableLabs/urql/pull/2607))
- Upgrade to [Wonka v6](https://github.com/0no-co/wonka) (`wonka@^6.0.0`), which has no breaking changes but is built to target ES2015 and comes with other minor improvements.
  The library has fully been migrated to TypeScript which will hopefully help with making contributions easier!, by [@kitten](https://github.com/kitten) (See [#2504](https://github.com/FormidableLabs/urql/pull/2504))

### Patch Changes

- Support nested refs in variables, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2608](https://github.com/FormidableLabs/urql/pull/2608))
- Updated dependencies (See [#2551](https://github.com/FormidableLabs/urql/pull/2551), [#2504](https://github.com/FormidableLabs/urql/pull/2504), [#2619](https://github.com/FormidableLabs/urql/pull/2619), [#2607](https://github.com/FormidableLabs/urql/pull/2607), and [#2504](https://github.com/FormidableLabs/urql/pull/2504))
  - @urql/core@3.0.0

## 0.6.4

### Patch Changes

- Allow Vue 2.7 as peer dependency to prevent peer dependency errors e.g. with pnpm, by [@dargmuesli](https://github.com/dargmuesli) (See [#2561](https://github.com/FormidableLabs/urql/pull/2561))

## 0.6.3

### Patch Changes

- ⚠️ Fix Node.js ESM re-export detection for `@urql/core` in `urql` package and CommonJS output for all other CommonJS-first packages. This ensures that Node.js' `cjs-module-lexer` can correctly identify re-exports and report them properly. Otherwise, this will lead to a runtime error, by [@kitten](https://github.com/kitten) (See [#2485](https://github.com/FormidableLabs/urql/pull/2485))

## 0.6.2

### Patch Changes

- ⚠️ Fix wait for the first non-stale result when using `await executeQuery`, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2410](https://github.com/FormidableLabs/urql/pull/2410))

## 0.6.1

### Patch Changes

- Extend peer dependency range of `graphql` to include `^16.0.0`.
  As always when upgrading across many packages of `urql`, especially including `@urql/core` we recommend you to deduplicate dependencies after upgrading, using `npm dedupe` or `npx yarn-deduplicate`, by [@kitten](https://github.com/kitten) (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
- Updated dependencies (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
  - @urql/core@2.3.6

## 0.6.0

### Minor Changes

- Provide the client as a ref so it can observe changes. This change is potentially breaking for
  anyone using the `useClient` import as it will now return a `Ref<Client>` rather than a `Client`, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2047](https://github.com/FormidableLabs/urql/pull/2047))

### Patch Changes

- Updated dependencies (See [#2027](https://github.com/FormidableLabs/urql/pull/2027) and [#1998](https://github.com/FormidableLabs/urql/pull/1998))
  - @urql/core@2.3.4

## 0.5.0

### Minor Changes

- Allow passing in a Ref of client to `provideClient` and `install`, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1962](https://github.com/FormidableLabs/urql/pull/1962))

### Patch Changes

- Updated dependencies (See [#1944](https://github.com/FormidableLabs/urql/pull/1944))
  - @urql/core@2.3.2

## 0.4.3

### Patch Changes

- Unwrap the `variables` proxy before we send it into the client, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1810](https://github.com/FormidableLabs/urql/pull/1810))

## 0.4.2

### Patch Changes

- Refactor `useQuery` implementation to utilise the single-source implementation of `@urql/core@2.1.0`. This should improve the stability of promisified `useQuery()` calls and prevent operations from not being issued in some edge cases, by [@kitten](https://github.com/kitten) (See [#1758](https://github.com/FormidableLabs/urql/pull/1758))
- Updated dependencies (See [#1776](https://github.com/FormidableLabs/urql/pull/1776) and [#1755](https://github.com/FormidableLabs/urql/pull/1755))
  - @urql/core@2.1.5

## 0.4.1

### Patch Changes

- Use client.executeMutation rather than client.mutation in useMutation, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1680](https://github.com/FormidableLabs/urql/pull/1680))
- Updated dependencies (See [#1709](https://github.com/FormidableLabs/urql/pull/1709))
  - @urql/core@2.1.4

## 0.4.0

### Minor Changes

- A `useClientHandle()` function has been added. This creates a `handle` on which all `use*` hooks can be called, like `await handle.useQuery(...)` or `await handle.useSubscription(...)` which is useful for sequentially chaining hook calls in an `async setup()` function or preserve the right instance of a `Client` across lifecycle hooks, by [@kitten](https://github.com/kitten) (See [#1599](https://github.com/FormidableLabs/urql/pull/1599))

### Patch Changes

- Remove closure-compiler from the build step (See [#1570](https://github.com/FormidableLabs/urql/pull/1570))
- The `useClient()` function will now throw a more helpful error when it's called outside of any lifecycle hooks, by [@kitten](https://github.com/kitten) (See [#1599](https://github.com/FormidableLabs/urql/pull/1599))
- Updated dependencies (See [#1570](https://github.com/FormidableLabs/urql/pull/1570), [#1509](https://github.com/FormidableLabs/urql/pull/1509), [#1600](https://github.com/FormidableLabs/urql/pull/1600), and [#1515](https://github.com/FormidableLabs/urql/pull/1515))
  - @urql/core@2.1.0

## 0.3.0

### Minor Changes

- **Breaking**: Remove `pollInterval` option from `useQuery`. Please consider adding an interval manually calling `executeQuery()`, by [@kitten](https://github.com/kitten) (See [#1374](https://github.com/FormidableLabs/urql/pull/1374))
- Remove deprecated `operationName` property from `Operation`s. The new `Operation.kind` property is now preferred. If you're creating new operations you may also use the `makeOperation` utility instead.
  When upgrading `@urql/core` please ensure that your package manager didn't install any duplicates of it. You may deduplicate it manually using `npx yarn-deduplicate` (for Yarn) or `npm dedupe` (for npm), by [@kitten](https://github.com/kitten) (See [#1357](https://github.com/FormidableLabs/urql/pull/1357))

### Patch Changes

- Updated dependencies (See [#1374](https://github.com/FormidableLabs/urql/pull/1374), [#1357](https://github.com/FormidableLabs/urql/pull/1357), and [#1375](https://github.com/FormidableLabs/urql/pull/1375))
  - @urql/core@2.0.0

## 0.2.1

### Patch Changes

- Add a built-in `gql` tag function helper to `@urql/core`. This behaves similarly to `graphql-tag` but only warns about _locally_ duplicated fragment names rather than globally. It also primes `@urql/core`'s key cache with the parsed `DocumentNode`, by [@kitten](https://github.com/kitten) (See [#1187](https://github.com/FormidableLabs/urql/pull/1187))
- Updated dependencies (See [#1187](https://github.com/FormidableLabs/urql/pull/1187), [#1186](https://github.com/FormidableLabs/urql/pull/1186), and [#1186](https://github.com/FormidableLabs/urql/pull/1186))
  - @urql/core@1.16.0

## 0.2.0

### Minor Changes

- Export a Vue plugin function as the default export, by [@LinusBorg](https://github.com/LinusBorg) (See [#1152](https://github.com/FormidableLabs/urql/pull/1152))
- Refactor `useQuery` to resolve the lazy promise for Vue Suspense to the latest result that has been requested as per the input to `useQuery`, by [@kitten](https://github.com/kitten) (See [#1162](https://github.com/FormidableLabs/urql/pull/1162))

### Patch Changes

- ⚠️ Fix pausing feature of `useQuery` by turning `isPaused` into a ref again, by [@LinusBorg](https://github.com/LinusBorg) (See [#1155](https://github.com/FormidableLabs/urql/pull/1155))
- ⚠️ Fix implementation of Vue's Suspense feature by making the lazy `PromiseLike` on the returned state passive, by [@kitten](https://github.com/kitten) (See [#1159](https://github.com/FormidableLabs/urql/pull/1159))

## 0.1.0

Initial release
