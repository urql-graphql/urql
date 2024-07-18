# @urql/svelte

## 4.2.1

### Patch Changes

- add support for Svelte 5 in the `peerDependencies`
  Submitted by [@itssumitrai](https://github.com/itssumitrai) (See [#3634](https://github.com/urql-graphql/urql/pull/3634))

## 4.2.0

### Minor Changes

- Mark `@urql/core` as a peer dependency as well as a regular dependency
  Submitted by [@kitten](https://github.com/kitten) (See [#3579](https://github.com/urql-graphql/urql/pull/3579))

### Patch Changes

- ⚠️ Fix subscription handlers to not receive `null` values
  Submitted by [@kitten](https://github.com/kitten) (See [#3581](https://github.com/urql-graphql/urql/pull/3581))

## 4.1.1

### Patch Changes

- Updated dependencies (See [#3520](https://github.com/urql-graphql/urql/pull/3520), [#3553](https://github.com/urql-graphql/urql/pull/3553), and [#3520](https://github.com/urql-graphql/urql/pull/3520))
  - @urql/core@5.0.0

## 4.1.0

### Minor Changes

- Add back the `reexecute` function
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3472](https://github.com/urql-graphql/urql/pull/3472))

### Patch Changes

- Updated dependencies (See [#3514](https://github.com/urql-graphql/urql/pull/3514), [#3505](https://github.com/urql-graphql/urql/pull/3505), [#3499](https://github.com/urql-graphql/urql/pull/3499), and [#3515](https://github.com/urql-graphql/urql/pull/3515))
  - @urql/core@4.3.0

## 4.0.4

### Patch Changes

- ⚠️ Fix `queryStore` and `subscriptionStore` not subscribing when `writable` calls its `StartStopNotifier`. This caused both stores to be inactive and become unresponsive when they’ve been unsubscribed from once, as they wouldn’t be able to restart their subscriptions to the `Client`
  Submitted by [@kitten](https://github.com/kitten) (See [#3331](https://github.com/urql-graphql/urql/pull/3331))

## 4.0.3

### Patch Changes

- Updated peer dependency range to include support for Svelte `^4.0.0`
  Submitted by [@ategen3rt](https://github.com/ategen3rt) (See [#3302](https://github.com/urql-graphql/urql/pull/3302))

## 4.0.2

### Patch Changes

- Update build process to generate correct source maps
  Submitted by [@kitten](https://github.com/kitten) (See [#3201](https://github.com/urql-graphql/urql/pull/3201))

## 4.0.1

### Patch Changes

- Publish with npm provenance
  Submitted by [@kitten](https://github.com/kitten) (See [#3180](https://github.com/urql-graphql/urql/pull/3180))

## 4.0.0

### Major Changes

- Update `OperationResult.hasNext` and `OperationResult.stale` to be required fields. If you have a custom exchange creating results, you'll have to add these fields or use the `makeResult`, `mergeResultPatch`, or `makeErrorResult` helpers
  Submitted by [@kitten](https://github.com/kitten) (See [#3061](https://github.com/urql-graphql/urql/pull/3061))
- Move `handler`, which combines subscription events, from `mutationStore` to `subscriptionStore`. It’s accidentally been defined and implemented on the wrong store and was meant to be on `subscriptionStore`
  Submitted by [@kitten](https://github.com/kitten) (See [#3078](https://github.com/urql-graphql/urql/pull/3078))

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

## 3.0.4

### Patch Changes

- ⚠️ Fix type utilities turning the `variables` properties optional when a type from `TypedDocumentNode` has no `Variables` or all optional `Variables`. Previously this would break for wrappers, e.g. in code generators, or when the type didn't quite match what we'd expect
  Submitted by [@kitten](https://github.com/kitten) (See [#3022](https://github.com/urql-graphql/urql/pull/3022))
- Updated dependencies (See [#3007](https://github.com/urql-graphql/urql/pull/3007), [#2962](https://github.com/urql-graphql/urql/pull/2962), [#3007](https://github.com/urql-graphql/urql/pull/3007), [#3015](https://github.com/urql-graphql/urql/pull/3015), and [#3022](https://github.com/urql-graphql/urql/pull/3022))
  - @urql/core@3.2.0

## 3.0.3

### Patch Changes

- ⚠️ Fix type-generation, with a change in TS/Rollup the type generation took the paths as src and resolved them into the types dir, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2870](https://github.com/urql-graphql/urql/pull/2870))
- Updated dependencies (See [#2872](https://github.com/urql-graphql/urql/pull/2872), [#2870](https://github.com/urql-graphql/urql/pull/2870), and [#2871](https://github.com/urql-graphql/urql/pull/2871))
  - @urql/core@3.1.1

## 3.0.2

### Patch Changes

- Move remaining `Variables` generics over from `object` default to `Variables extends AnyVariables = AnyVariables`. This has been introduced previously in [#2607](https://github.com/urql-graphql/urql/pull/2607) but some missing ports have been missed due to TypeScript not catching them previously. Depending on your TypeScript version the `object` default is incompatible with `AnyVariables`, by [@kitten](https://github.com/kitten) (See [#2843](https://github.com/urql-graphql/urql/pull/2843))
- Updated dependencies (See [#2843](https://github.com/urql-graphql/urql/pull/2843), [#2847](https://github.com/urql-graphql/urql/pull/2847), [#2850](https://github.com/urql-graphql/urql/pull/2850), and [#2846](https://github.com/urql-graphql/urql/pull/2846))
  - @urql/core@3.1.0

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

## 2.0.2

### Patch Changes

- Made variables optional for all operations, by [@mpiorowski](https://github.com/mpiorowski) (See [#2496](https://github.com/FormidableLabs/urql/pull/2496))
- ⚠️ Fix issue with `subscriptionStore` and `queryStore` eagerly terminating the subscription due to `derived`, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2514](https://github.com/FormidableLabs/urql/pull/2514))

## 2.0.1

### Patch Changes

- ⚠️ Fix Node.js ESM re-export detection for `@urql/core` in `urql` package and CommonJS output for all other CommonJS-first packages. This ensures that Node.js' `cjs-module-lexer` can correctly identify re-exports and report them properly. Otherwise, this will lead to a runtime error, by [@kitten](https://github.com/kitten) (See [#2485](https://github.com/FormidableLabs/urql/pull/2485))

## 2.0.0

### Major Changes

- Reimplement Svelte with functional-only API.
  We've gotten plenty of feedback and issues from the Svelte community about our prior
  Svelte bindings. These bindings favoured a Store singleton to read and write to,
  and a separate signal to start an operation.
  Svelte usually however calls for a lot more flexibility, so we're returning the
  API to a functional-only API again that serves to only create stores, which is more
  similar to the original implementation, by [@jonathanstanley](https://github.com/jonathanstanley) (See [#2370](https://github.com/FormidableLabs/urql/pull/2370))

### Patch Changes

- Updated dependencies (See [#2446](https://github.com/FormidableLabs/urql/pull/2446), [#2456](https://github.com/FormidableLabs/urql/pull/2456), and [#2457](https://github.com/FormidableLabs/urql/pull/2457))
  - @urql/core@2.5.0

## 1.3.3

### Patch Changes

- Extend peer dependency range of `graphql` to include `^16.0.0`.
  As always when upgrading across many packages of `urql`, especially including `@urql/core` we recommend you to deduplicate dependencies after upgrading, using `npm dedupe` or `npx yarn-deduplicate`, by [@kitten](https://github.com/kitten) (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
- Updated dependencies (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
  - @urql/core@2.3.6

## 1.3.2

### Patch Changes

- ⚠️ Fix initialize `operationStore` with `fetching: false`, the invocation of `query` or any other operation will mark it as `true`
  when deemed appropriate, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2048](https://github.com/FormidableLabs/urql/pull/2048))
- Updated dependencies (See [#2027](https://github.com/FormidableLabs/urql/pull/2027) and [#1998](https://github.com/FormidableLabs/urql/pull/1998))
  - @urql/core@2.3.4

## 1.3.1

### Patch Changes

- Add missing `pause` on the `operationStore` return value, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1925](https://github.com/FormidableLabs/urql/pull/1925))
- Updated dependencies (See [#1944](https://github.com/FormidableLabs/urql/pull/1944))
  - @urql/core@2.3.2

## 1.3.0

### Minor Changes

- Improve granularity of `operationStore` updates when `query`, `variables`, and `context` are changed. This also adds an `operationStore(...).reexecute()` method, which optionally accepts a new context value and forces an update on the store, so that a query may reexecute, by [@kitten](https://github.com/kitten) (See [#1780](https://github.com/FormidableLabs/urql/pull/1780))

### Patch Changes

- Loosen `subscription(...)` type further to allow any `operationStore` input, regardless of the `Result` produced, by [@kitten](https://github.com/kitten) (See [#1779](https://github.com/FormidableLabs/urql/pull/1779))
- Updated dependencies (See [#1776](https://github.com/FormidableLabs/urql/pull/1776) and [#1755](https://github.com/FormidableLabs/urql/pull/1755))
  - @urql/core@2.1.5

## 1.2.3

### Patch Changes

- Improve `OperationStore` and `subscription` types to allow for result types of `data` that differ from the original `Data` type, which may be picked up from `TypedDocumentNode`, by [@kitten](https://github.com/kitten) (See [#1731](https://github.com/FormidableLabs/urql/pull/1731))
- Use client.executeMutation rather than client.mutation, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1732](https://github.com/FormidableLabs/urql/pull/1732))
- Updated dependencies (See [#1709](https://github.com/FormidableLabs/urql/pull/1709))
  - @urql/core@2.1.4

## 1.2.2

### Patch Changes

- Remove closure-compiler from the build step (See [#1570](https://github.com/FormidableLabs/urql/pull/1570))
- Updated dependencies (See [#1570](https://github.com/FormidableLabs/urql/pull/1570), [#1509](https://github.com/FormidableLabs/urql/pull/1509), [#1600](https://github.com/FormidableLabs/urql/pull/1600), and [#1515](https://github.com/FormidableLabs/urql/pull/1515))
  - @urql/core@2.1.0

## 1.2.1

### Patch Changes

- Allow `mutation` to accept a more partial `GraphQLRequest` object without a `key` or `variables`, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1473](https://github.com/FormidableLabs/urql/pull/1473))

## 1.2.0

### Minor Changes

- Remove deprecated `operationName` property from `Operation`s. The new `Operation.kind` property is now preferred. If you're creating new operations you may also use the `makeOperation` utility instead.
  When upgrading `@urql/core` please ensure that your package manager didn't install any duplicates of it. You may deduplicate it manually using `npx yarn-deduplicate` (for Yarn) or `npm dedupe` (for npm), by [@kitten](https://github.com/kitten) (See [#1357](https://github.com/FormidableLabs/urql/pull/1357))

### Patch Changes

- Updated dependencies (See [#1374](https://github.com/FormidableLabs/urql/pull/1374), [#1357](https://github.com/FormidableLabs/urql/pull/1357), and [#1375](https://github.com/FormidableLabs/urql/pull/1375))
  - @urql/core@2.0.0

## 1.1.4

### Patch Changes

- Add a built-in `gql` tag function helper to `@urql/core`. This behaves similarly to `graphql-tag` but only warns about _locally_ duplicated fragment names rather than globally. It also primes `@urql/core`'s key cache with the parsed `DocumentNode`, by [@kitten](https://github.com/kitten) (See [#1187](https://github.com/FormidableLabs/urql/pull/1187))
- Updated dependencies (See [#1187](https://github.com/FormidableLabs/urql/pull/1187), [#1186](https://github.com/FormidableLabs/urql/pull/1186), and [#1186](https://github.com/FormidableLabs/urql/pull/1186))
  - @urql/core@1.16.0

## 1.1.3

### Patch Changes

- Add support for `TypedDocumentNode` to infer the type of the `OperationResult` and `Operation` for all methods, functions, and hooks that either directly or indirectly accept a `DocumentNode`. See [`graphql-typed-document-node` and the corresponding blog post for more information.](https://github.com/dotansimha/graphql-typed-document-node), by [@kitten](https://github.com/kitten) (See [#1113](https://github.com/FormidableLabs/urql/pull/1113))
- Updated dependencies (See [#1119](https://github.com/FormidableLabs/urql/pull/1119), [#1113](https://github.com/FormidableLabs/urql/pull/1113), [#1104](https://github.com/FormidableLabs/urql/pull/1104), and [#1123](https://github.com/FormidableLabs/urql/pull/1123))
  - @urql/core@1.15.0

## 1.1.2

### Patch Changes

- Replace `void` union types with `undefined` in `OperationStore` to allow nullish property access in TypeScript, by [@kitten](https://github.com/kitten) (See [#1053](https://github.com/FormidableLabs/urql/pull/1053))

## 1.1.1

### Patch Changes

- ⚠️ Fix missing `stale` flag updates on query results, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1044](https://github.com/FormidableLabs/urql/pull/1044))

## 1.1.0

### Minor Changes

- Support passing `pause` to stop executing queries or subscriptions, by [@kitten](https://github.com/kitten) (See [#1046](https://github.com/FormidableLabs/urql/pull/1046))

### Patch Changes

- ⚠️ Fix an issue where updated `context` options wouldn't cause a new query to be executed, or updates to the store would erroneously throw a debug error, by [@kitten](https://github.com/kitten) (See [#1046](https://github.com/FormidableLabs/urql/pull/1046))

## 1.0.1

### Patch Changes

- ⚠️ Fix `stale` keeping a `truthy` value on a `cache-and-network` operation, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1032](https://github.com/FormidableLabs/urql/pull/1032))

## 1.0.0

The new `@urql/svelte` API features the `query`, `mutation`, and `subscription` utilities, which are
called as part of a component's normal lifecycle and accept `operationStore` stores. These are
writable stores that encapsulate both a GraphQL operation's inputs and outputs (the result)!
Learn more about how to use `@urql/svelte` [in our new API
docs](https://formidable.com/open-source/urql/docs/api/svelte/) or starting from the [Basics
pages.](https://formidable.com/open-source/urql/docs/basics/)

### Major Changes

- Reimplement the `@urql/svelte` API, which is now marked as stable, by [@kitten](https://github.com/kitten) (See [#1016](https://github.com/FormidableLabs/urql/pull/1016))

## 0.4.0

### Minor Changes

- Add the operation to the query, mutation and subscription result, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#924](https://github.com/FormidableLabs/urql/pull/924))

### Patch Changes

- Updated dependencies (See [#911](https://github.com/FormidableLabs/urql/pull/911) and [#908](https://github.com/FormidableLabs/urql/pull/908))
  - @urql/core@1.12.3

## 0.3.0

### Minor Changes

- Refactor all operations to allow for more use-cases which preserve state and allow all modes of Svelte to be applied to urql.
  ```
  // Standard Usage:
  mutate({ query, variables })()
  // Subscribable Usage:
  $: result = mutate({ query, variables });
  // Curried Usage
  const executeMutation = mutate({ query, variables });
  const onClick = () => executeMutation();
  // Curried Usage with overrides
  const executeMutation = mutate({ query });
  const onClick = () => await executeMutation({ variables });
  // Subscribable Usage (as before):
  $: result = query({ query: TestQuery, variables });
  // Subscribable Usage which preserves state over time:
  const testQuery = query({ query: TestQuery });
  // - this preserves the state even when the variables change!
  $: result = testQuery({ variables });
  // Promise-based callback usage:
  const testQuery = query({ query: TestQuery });
  const doQuery = async () => await testQuery;
  // Promise-based usage updates the subscribables!
  const testQuery = query({ query: TestQuery });
  const doQuery = async () => await testQuery;
  // - doQuery will also update this result
  $: result = query({ query: TestQuery, variables });
  ```

### Patch Changes

- Updated dependencies (See [#860](https://github.com/FormidableLabs/urql/pull/860) and [#861](https://github.com/FormidableLabs/urql/pull/861))
  - @urql/core@1.12.1

## 0.2.4

### Patch Changes

- Upgrade to a minimum version of wonka@^4.0.14 to work around issues with React Native's minification builds, which use uglify-es and could lead to broken bundles, by [@kitten](https://github.com/kitten) (See [#842](https://github.com/FormidableLabs/urql/pull/842))
- Updated dependencies (See [#838](https://github.com/FormidableLabs/urql/pull/838) and [#842](https://github.com/FormidableLabs/urql/pull/842))
  - @urql/core@1.12.0

## 0.2.3

### Patch Changes

- Add a `"./package.json"` entry to the `package.json`'s `"exports"` field for Node 14. This seems to be required by packages like `rollup-plugin-svelte` to function properly, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#771](https://github.com/FormidableLabs/urql/pull/771))
- Updated dependencies (See [#771](https://github.com/FormidableLabs/urql/pull/771))
  - @urql/core@1.11.6

## 0.2.2

### Patch Changes

- Update `mutate` helper to return a Promise directly rather than a lazy Promise-like object, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#758](https://github.com/FormidableLabs/urql/pull/758))

## 0.2.1

### Patch Changes

- Bump @urql/core to ensure exchanges have dispatchDebug, this could formerly result in a crash, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#726](https://github.com/FormidableLabs/urql/pull/726))

## 0.2.0

### Minor Changes

- Update `mutate()` API to accept an options argument, instead of separate arguments, to increase consistency, by [@kitten](https://github.com/kitten) (See [#705](https://github.com/FormidableLabs/urql/pull/705))

## 0.1.3

### Patch Changes

- Add graphql@^15.0.0 to peer dependency range, by [@kitten](https://github.com/kitten) (See [#688](https://github.com/FormidableLabs/urql/pull/688))
- Forcefully bump @urql/core package in all bindings and in @urql/exchange-graphcache.
  We're aware that in some cases users may not have upgraded to @urql/core, even though that's within
  the typical patch range. Since the latest @urql/core version contains a patch that is required for
  `cache-and-network` to work, we're pushing another patch that now forcefully bumps everyone to the
  new version that includes this fix, by [@kitten](https://github.com/kitten) (See [#684](https://github.com/FormidableLabs/urql/pull/684))
- Updated dependencies (See [#688](https://github.com/FormidableLabs/urql/pull/688) and [#678](https://github.com/FormidableLabs/urql/pull/678))
  - @urql/core@1.10.8

## 0.1.2

### Patch Changes

- ⚠️ Fix node resolution when using Webpack, which experiences a bug where it only resolves
  `package.json:main` instead of `module` when an `.mjs` file imports a package, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#642](https://github.com/FormidableLabs/urql/pull/642))
- Updated dependencies (See [#642](https://github.com/FormidableLabs/urql/pull/642))
  - @urql/core@1.10.4

## 0.1.1

### Patch Changes

- ⚠️ Fix Node.js Module support for v13 (experimental-modules) and v14. If your bundler doesn't support
  `.mjs` files and fails to resolve the new version, please double check your configuration for
  Webpack, or similar tools, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#637](https://github.com/FormidableLabs/urql/pull/637))
- Updated dependencies (See [#637](https://github.com/FormidableLabs/urql/pull/637))
  - @urql/core@1.10.3

## 0.1.0

### Patch Changes

- Bumps the `@urql/core` dependency minor version to ^1.10.1 for React, Preact and Svelte, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#623](https://github.com/FormidableLabs/urql/pull/623))
- Updated dependencies (See [#621](https://github.com/FormidableLabs/urql/pull/621))
  - @urql/core@1.10.2

## 0.1.0-alpha.0

Initial Alpha Release
