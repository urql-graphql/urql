# @urql/vue

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
