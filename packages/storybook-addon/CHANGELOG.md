# @urql/storybook-addon

## 1.0.9

### Patch Changes

- ⚠️ Fix Node.js ESM re-export detection for `@urql/core` in `urql` package and CommonJS output for all other CommonJS-first packages. This ensures that Node.js' `cjs-module-lexer` can correctly identify re-exports and report them properly. Otherwise, this will lead to a runtime error, by [@kitten](https://github.com/kitten) (See [#2485](https://github.com/FormidableLabs/urql/pull/2485))

## 1.0.8

### Patch Changes

- Extend peer dependency range of `graphql` to include `^16.0.0`.
  As always when upgrading across many packages of `urql`, especially including `@urql/core` we recommend you to deduplicate dependencies after upgrading, using `npm dedupe` or `npx yarn-deduplicate`, by [@kitten](https://github.com/kitten) (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))

## 1.0.7

### Patch Changes

- Remove closure-compiler from the build step (See [#1570](https://github.com/FormidableLabs/urql/pull/1570))

## 1.0.6

### Patch Changes

- Add Storybook metadata to `package.json` for npm discoverability, by [@coderkevin](https://github.com/coderkevin) (See [#1469](https://github.com/FormidableLabs/urql/pull/1469))

## 1.0.5

### Patch Changes

- Add missing optional dependency (@urql/devtools), by [@andyrichardson](https://github.com/andyrichardson) (See [#1129](https://github.com/FormidableLabs/urql/pull/1129))

## 1.0.4

### Patch Changes

- - Add `@urql/devtools` to `@urql/storybook-addon`. Previously it was not included (See [#1092](https://github.com/FormidableLabs/urql/issues/1092)), but now the exchange works out of the box with Storybook, by [@r281GQ](https://github.com/r281GQ) (See [#1112](https://github.com/FormidableLabs/urql/pull/1112))

## 1.0.3

**Initial Release**
