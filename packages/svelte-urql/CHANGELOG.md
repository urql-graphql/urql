# @urql/svelte

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
