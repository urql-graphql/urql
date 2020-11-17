# @urql/vue

## 0.2.0

### Minor Changes

- expose Vue plugin function as default export, by [@LinusBorg](https://github.com/LinusBorg) (See [#1152](https://github.com/FormidableLabs/urql/pull/1152))
- Refactor `useQuery` to resolve the lazy promise for Vue Suspense to the latest result that has been requested as per the input to `useQuery`, by [@kitten](https://github.com/kitten) (See [#1162](https://github.com/FormidableLabs/urql/pull/1162))

### Patch Changes

- ⚠️ fix pausing feature of useQuery by turning "isPaused" into a ref again, by [@LinusBorg](https://github.com/LinusBorg) (See [#1155](https://github.com/FormidableLabs/urql/pull/1155))
- ⚠️ Fix implementation of Vue's Suspense feature by making the lazy `PromiseLike` on the returned state passive, by [@kitten](https://github.com/kitten) (See [#1159](https://github.com/FormidableLabs/urql/pull/1159))

## 0.1.0

Initial release
