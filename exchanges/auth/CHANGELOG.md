# Changelog

## 0.1.7

### Patch Changes

- Extend peer dependency range of `graphql` to include `^16.0.0`.
  As always when upgrading across many packages of `urql`, especially including `@urql/core` we recommend you to deduplicate dependencies after upgrading, using `npm dedupe` or `npx yarn-deduplicate`, by [@kitten](https://github.com/kitten) (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
- Updated dependencies (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
  - @urql/core@2.3.6

## 0.1.6

### Patch Changes

- ⚠️ Fix willAuthError causing duplicate operations, by [@yankovalera](https://github.com/yankovalera) (See [#1849](https://github.com/FormidableLabs/urql/pull/1849))
- Updated dependencies (See [#1851](https://github.com/FormidableLabs/urql/pull/1851), [#1850](https://github.com/FormidableLabs/urql/pull/1850), and [#1852](https://github.com/FormidableLabs/urql/pull/1852))
  - @urql/core@2.2.0

## 0.1.5

### Patch Changes

- Expose `AuthContext` type, by [@arempe93](https://github.com/arempe93) (See [#1828](https://github.com/FormidableLabs/urql/pull/1828))
- Updated dependencies (See [#1829](https://github.com/FormidableLabs/urql/pull/1829))
  - @urql/core@2.1.6

## 0.1.4

### Patch Changes

- Allow `mutate` to infer the result's type when a `TypedDocumentNode` is passed via the usual generics, like `client.mutation` for instance, by [@younesmln](https://github.com/younesmln) (See [#1796](https://github.com/FormidableLabs/urql/pull/1796))

## 0.1.3

### Patch Changes

- Remove closure-compiler from the build step (See [#1570](https://github.com/FormidableLabs/urql/pull/1570))
- Updated dependencies (See [#1570](https://github.com/FormidableLabs/urql/pull/1570), [#1509](https://github.com/FormidableLabs/urql/pull/1509), [#1600](https://github.com/FormidableLabs/urql/pull/1600), and [#1515](https://github.com/FormidableLabs/urql/pull/1515))
  - @urql/core@2.1.0

## 0.1.2

### Patch Changes

- Deprecate the `Operation.operationName` property in favor of `Operation.kind`. This name was
  previously confusing as `operationName` was effectively referring to two different things. You can
  safely upgrade to this new version, however to mute all deprecation warnings you will have to
  **upgrade** all `urql` packages you use. If you have custom exchanges that spread operations, please
  use [the new `makeOperation` helper
  function](https://formidable.com/open-source/urql/docs/api/core/#makeoperation) instead, by [@bkonkle](https://github.com/bkonkle) (See [#1045](https://github.com/FormidableLabs/urql/pull/1045))
- Updated dependencies (See [#1094](https://github.com/FormidableLabs/urql/pull/1094) and [#1045](https://github.com/FormidableLabs/urql/pull/1045))
  - @urql/core@1.14.0

## 0.1.1

### Patch Changes

- ⚠️ Fix an operation that triggers `willAuthError` with a truthy return value being sent off twice, by [@kitten](https://github.com/kitten) (See [#1075](https://github.com/FormidableLabs/urql/pull/1075))

## v0.1.0

**Initial Release**
