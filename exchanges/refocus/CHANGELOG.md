# Changelog

## 0.2.4

### Patch Changes

- ⚠️ Fix use context of the reexecuting operation, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2104](https://github.com/FormidableLabs/urql/pull/2104))

## 0.2.3

### Patch Changes

- Remove closure-compiler from the build step (See [#1570](https://github.com/FormidableLabs/urql/pull/1570))
- Updated dependencies (See [#1570](https://github.com/FormidableLabs/urql/pull/1570), [#1509](https://github.com/FormidableLabs/urql/pull/1509), [#1600](https://github.com/FormidableLabs/urql/pull/1600), and [#1515](https://github.com/FormidableLabs/urql/pull/1515))
  - @urql/core@2.1.0

## 0.2.2

### Patch Changes

- Prevent the refocus Exchange from being used on a Node env, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1430](https://github.com/FormidableLabs/urql/pull/1430))

## 0.2.1

### Patch Changes

- Deprecate the `Operation.operationName` property in favor of `Operation.kind`. This name was
  previously confusing as `operationName` was effectively referring to two different things. You can
  safely upgrade to this new version, however to mute all deprecation warnings you will have to
  **upgrade** all `urql` packages you use. If you have custom exchanges that spread operations, please
  use [the new `makeOperation` helper
  function](https://formidable.com/open-source/urql/docs/api/core/#makeoperation) instead, by [@bkonkle](https://github.com/bkonkle) (See [#1045](https://github.com/FormidableLabs/urql/pull/1045))
- Updated dependencies (See [#1094](https://github.com/FormidableLabs/urql/pull/1094) and [#1045](https://github.com/FormidableLabs/urql/pull/1045))
  - @urql/core@1.14.0

## 0.2.0

### Minor Changes

- Switch from a `focus-event` triggering the refetch to a change in [`page-visbility`](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API). This means that interacting with an `iframe` and then going back to the page won't trigger a refetch, interacting with Devtools won't cause refetches and a bubbled `focusEvent` won't trigger a refetch, by [@tatchi](https://github.com/tatchi) (See [#1077](https://github.com/FormidableLabs/urql/pull/1077))

## v0.1.0

**Initial Release**
