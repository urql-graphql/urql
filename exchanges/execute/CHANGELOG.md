# Changelog

## 1.1.0

### Minor Changes

- Support async iterated results, including subscriptions via `AsyncIterator` support and `@defer` / `@stream` if the appropriate version of `graphql` is used, e.g. `15.4.0-experimental-stream-defer.1`, by [@kitten](https://github.com/kitten) (See [#1854](https://github.com/FormidableLabs/urql/pull/1854))

### Patch Changes

- Updated dependencies (See [#1854](https://github.com/FormidableLabs/urql/pull/1854))
  - @urql/core@2.3.0

## 1.0.5

### Patch Changes

- Expose `ExecuteExchangeArgs` interface, by [@taneba](https://github.com/taneba) (See [#1837](https://github.com/FormidableLabs/urql/pull/1837))
- Updated dependencies (See [#1829](https://github.com/FormidableLabs/urql/pull/1829))
  - @urql/core@2.1.6

## 1.0.4

### Patch Changes

- Remove closure-compiler from the build step (See [#1570](https://github.com/FormidableLabs/urql/pull/1570))
- Updated dependencies (See [#1570](https://github.com/FormidableLabs/urql/pull/1570), [#1509](https://github.com/FormidableLabs/urql/pull/1509), [#1600](https://github.com/FormidableLabs/urql/pull/1600), and [#1515](https://github.com/FormidableLabs/urql/pull/1515))
  - @urql/core@2.1.0

## 1.0.3

### Patch Changes

- Export `getOperationName` from `@urql/core` and use it in `@urql/exchange-execute`, fixing several imports, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1135](https://github.com/FormidableLabs/urql/pull/1135))
- Updated dependencies (See [#1135](https://github.com/FormidableLabs/urql/pull/1135))
  - @urql/core@1.15.1

## 1.0.2

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

## 1.0.1

### Patch Changes

- Upgrade to a minimum version of wonka@^4.0.14 to work around issues with React Native's minification builds, which use uglify-es and could lead to broken bundles, by [@kitten](https://github.com/kitten) (See [#842](https://github.com/FormidableLabs/urql/pull/842))
- Updated dependencies (See [#838](https://github.com/FormidableLabs/urql/pull/838) and [#842](https://github.com/FormidableLabs/urql/pull/842))
  - @urql/core@1.12.0

## v1.0.0

**Initial Release**
