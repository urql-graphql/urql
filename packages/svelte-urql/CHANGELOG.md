# @urql/svelte

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
