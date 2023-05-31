# Changelog

## 2.2.2

### Patch Changes

- Update build process to generate correct source maps
  Submitted by [@kitten](https://github.com/kitten) (See [#3201](https://github.com/urql-graphql/urql/pull/3201))

## 2.2.1

### Patch Changes

- Publish with npm provenance
  Submitted by [@kitten](https://github.com/kitten) (See [#3180](https://github.com/urql-graphql/urql/pull/3180))

## 2.2.0

### Minor Changes

- Update exchanges to drop redundant `share` calls, since `@urql/core`’s `composeExchanges` utility now automatically does so for us
  Submitted by [@kitten](https://github.com/kitten) (See [#3082](https://github.com/urql-graphql/urql/pull/3082))
- Remove `getOperationName` export from `@urql/core`
  Submitted by [@kitten](https://github.com/kitten) (See [#3062](https://github.com/urql-graphql/urql/pull/3062))

### Patch Changes

- Upgrade to `wonka@^6.3.0`
  Submitted by [@kitten](https://github.com/kitten) (See [#3104](https://github.com/urql-graphql/urql/pull/3104))
- Add TSDocs for all exchanges, documenting API internals
  Submitted by [@kitten](https://github.com/kitten) (See [#3072](https://github.com/urql-graphql/urql/pull/3072))
- Updated dependencies (See [#3101](https://github.com/urql-graphql/urql/pull/3101), [#3033](https://github.com/urql-graphql/urql/pull/3033), [#3054](https://github.com/urql-graphql/urql/pull/3054), [#3053](https://github.com/urql-graphql/urql/pull/3053), [#3060](https://github.com/urql-graphql/urql/pull/3060), [#3081](https://github.com/urql-graphql/urql/pull/3081), [#3039](https://github.com/urql-graphql/urql/pull/3039), [#3104](https://github.com/urql-graphql/urql/pull/3104), [#3082](https://github.com/urql-graphql/urql/pull/3082), [#3097](https://github.com/urql-graphql/urql/pull/3097), [#3061](https://github.com/urql-graphql/urql/pull/3061), [#3055](https://github.com/urql-graphql/urql/pull/3055), [#3085](https://github.com/urql-graphql/urql/pull/3085), [#3079](https://github.com/urql-graphql/urql/pull/3079), [#3087](https://github.com/urql-graphql/urql/pull/3087), [#3059](https://github.com/urql-graphql/urql/pull/3059), [#3055](https://github.com/urql-graphql/urql/pull/3055), [#3057](https://github.com/urql-graphql/urql/pull/3057), [#3050](https://github.com/urql-graphql/urql/pull/3050), [#3062](https://github.com/urql-graphql/urql/pull/3062), [#3051](https://github.com/urql-graphql/urql/pull/3051), [#3043](https://github.com/urql-graphql/urql/pull/3043), [#3063](https://github.com/urql-graphql/urql/pull/3063), [#3054](https://github.com/urql-graphql/urql/pull/3054), [#3102](https://github.com/urql-graphql/urql/pull/3102), [#3097](https://github.com/urql-graphql/urql/pull/3097), [#3106](https://github.com/urql-graphql/urql/pull/3106), [#3058](https://github.com/urql-graphql/urql/pull/3058), and [#3062](https://github.com/urql-graphql/urql/pull/3062))
  - @urql/core@4.0.0

## 2.1.1

### Patch Changes

- ⚠️ Fix type-generation, with a change in TS/Rollup the type generation took the paths as src and resolved them into the types dir, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2870](https://github.com/urql-graphql/urql/pull/2870))
- Updated dependencies (See [#2872](https://github.com/urql-graphql/urql/pull/2872), [#2870](https://github.com/urql-graphql/urql/pull/2870), and [#2871](https://github.com/urql-graphql/urql/pull/2871))
  - @urql/core@3.1.1

## 2.1.0

### Minor Changes

- The `context` option, which may be set to a context value or a function returning a context, can now return a `Promise` and will be correctly resolved and awaited, by [@YutaUra](https://github.com/YutaUra) (See [#2806](https://github.com/urql-graphql/urql/pull/2806))

### Patch Changes

- End iterator when teardown functions runs, previously it waited for one extra call to next, then ended the iterator, by [@danielkaxis](https://github.com/danielkaxis) (See [#2803](https://github.com/urql-graphql/urql/pull/2803))
- Updated dependencies (See [#2843](https://github.com/urql-graphql/urql/pull/2843), [#2847](https://github.com/urql-graphql/urql/pull/2847), [#2850](https://github.com/urql-graphql/urql/pull/2850), and [#2846](https://github.com/urql-graphql/urql/pull/2846))
  - @urql/core@3.1.0

## 2.0.0

### Major Changes

- **Goodbye IE11!** 👋 This major release removes support for IE11. All code that is shipped will be transpiled much less and will _not_ be ES5-compatible anymore, by [@kitten](https://github.com/kitten) (See [#2504](https://github.com/FormidableLabs/urql/pull/2504))
- Upgrade to [Wonka v6](https://github.com/0no-co/wonka) (`wonka@^6.0.0`), which has no breaking changes but is built to target ES2015 and comes with other minor improvements.
  The library has fully been migrated to TypeScript which will hopefully help with making contributions easier!, by [@kitten](https://github.com/kitten) (See [#2504](https://github.com/FormidableLabs/urql/pull/2504))

### Minor Changes

- Remove the `babel-plugin-modular-graphql` helper, this because the graphql package hasn't converted to ESM yet which gives issues in node environments, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2551](https://github.com/FormidableLabs/urql/pull/2551))

### Patch Changes

- ⚠️ fix return for context function argument, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2583](https://github.com/FormidableLabs/urql/pull/2583))
- Updated dependencies (See [#2551](https://github.com/FormidableLabs/urql/pull/2551), [#2504](https://github.com/FormidableLabs/urql/pull/2504), [#2619](https://github.com/FormidableLabs/urql/pull/2619), [#2607](https://github.com/FormidableLabs/urql/pull/2607), and [#2504](https://github.com/FormidableLabs/urql/pull/2504))
  - @urql/core@3.0.0

## 1.2.3

### Patch Changes

- Support using default values with directives. Previously, using a variables with a default value within a directive would fail the validation if it is empty, by [@fathyb](https://github.com/fathyb) (See [#2435](https://github.com/FormidableLabs/urql/pull/2435))

## 1.2.2

### Patch Changes

- Upgrade modular imports for graphql package, which fixes an issue in `@urql/exchange-execute`, where `graphql@16` files wouldn't resolve the old `subscribe` import from the correct file, by [@kitten](https://github.com/kitten) (See [#2149](https://github.com/FormidableLabs/urql/pull/2149))

## 1.2.1

### Patch Changes

- Extend peer dependency range of `graphql` to include `^16.0.0`.
  As always when upgrading across many packages of `urql`, especially including `@urql/core` we recommend you to deduplicate dependencies after upgrading, using `npm dedupe` or `npx yarn-deduplicate`, by [@kitten](https://github.com/kitten) (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
- Updated dependencies (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
  - @urql/core@2.3.6

## 1.2.0

### Minor Changes

- Add subscription support, by [@Tigge](https://github.com/Tigge) (See [#2061](https://github.com/FormidableLabs/urql/pull/2061))

### Patch Changes

- Updated dependencies (See [#2074](https://github.com/FormidableLabs/urql/pull/2074))
  - @urql/core@2.3.5

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
