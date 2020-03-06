# @urql/core

## 1.9.1

### Patch Changes

- ⚠️ Fix `cache-only` operations being forwarded and triggering fetch requests, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#551](https://github.com/FormidableLabs/urql/pull/551))
- Adds a one-tick delay to the subscriptionExchange to prevent unnecessary early tear downs, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#542](https://github.com/FormidableLabs/urql/pull/542))
- Add enableAllOperations option to subscriptionExchange to let it handle queries and mutations as well, by [@kitten](https://github.com/kitten) (See [#544](https://github.com/FormidableLabs/urql/pull/544))

## 1.9.0

### Minor Changes

- Adds the `maskTypename` export to urql-core, this deeply masks typenames from the given payload.
  Masking `__typename` properties is also available as a `maskTypename` option on the `Client`. Setting this to true will
  strip typenames from results, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#533](https://github.com/FormidableLabs/urql/pull/533))
- Add support for sending queries using GET instead of POST method (See [#519](https://github.com/FormidableLabs/urql/pull/519))
- Add client.readQuery method (See [#518](https://github.com/FormidableLabs/urql/pull/518))

### Patch Changes

- ⚠️ Fix ssrExchange not serialising networkError on CombinedErrors correctly. (See [#515](https://github.com/FormidableLabs/urql/pull/515))
- Add explicit error when creating Client without a URL in development. (See [#512](https://github.com/FormidableLabs/urql/pull/512))
