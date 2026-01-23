# Changelog

## 1.1.2

### Patch Changes

- Add support for `@react-native-async-storage/async-storage` v2.0.0
  Submitted by [@nhangeland](https://github.com/nhangeland) (See [#3836](https://github.com/urql-graphql/urql/pull/3836))

## 1.1.1

### Patch Changes

- Omit minified files and sourcemaps' `sourcesContent` in published packages
  Submitted by [@kitten](https://github.com/kitten) (See [#3755](https://github.com/urql-graphql/urql/pull/3755))

## 1.1.0

### Minor Changes

- Bump peer-dependency of `@react-native-community/netinfo` to allow v11
  Submitted by [@albinhubsch](https://github.com/albinhubsch) (See [#3485](https://github.com/urql-graphql/urql/pull/3485))

## 1.0.3

### Patch Changes

- Switch `react` imports to namespace imports, and update build process for CommonJS outputs to interoperate with `__esModule` marked modules again
  Submitted by [@kitten](https://github.com/kitten) (See [#3251](https://github.com/urql-graphql/urql/pull/3251))

## 1.0.2

### Patch Changes

- Publish with npm provenance
  Submitted by [@kitten](https://github.com/kitten) (See [#3180](https://github.com/urql-graphql/urql/pull/3180))

## 1.0.1

### Patch Changes

- Add TSDocs to `@urql/*` packages
  Submitted by [@kitten](https://github.com/kitten) (See [#3079](https://github.com/urql-graphql/urql/pull/3079))

## 1.0.0

### Major Changes

- **Goodbye IE11!** 👋 This major release removes support for IE11. All code that is shipped will be transpiled much less and will _not_ be ES5-compatible anymore, by [@kitten](https://github.com/kitten) (See [#2504](https://github.com/FormidableLabs/urql/pull/2504))

## 0.1.1

### Patch Changes

- ⚠️ Fix issue where the in-memory cache would not be cleared, by [@benmechen](https://github.com/benmechen) (See [#2222](https://github.com/FormidableLabs/urql/pull/2222))

## v0.1.0

**Initial Release**
