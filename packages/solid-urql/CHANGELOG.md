# @urql/solid

## 1.0.1

### Patch Changes

- Use `@solid-primitives/utils` for `access` and `MaybeAccessor` utilities instead of custom implementations. This aligns the package with standard Solid ecosystem conventions
  Submitted by [@davedbase](https://github.com/davedbase) (See [#3837](https://github.com/urql-graphql/urql/pull/3837))

## 1.0.0

### Patch Changes

- Updated dependencies (See [#3789](https://github.com/urql-graphql/urql/pull/3789) and [#3807](https://github.com/urql-graphql/urql/pull/3807))
  - @urql/core@6.0.0

## 0.1.2

### Patch Changes

- Omit minified files and sourcemaps' `sourcesContent` in published packages
  Submitted by [@kitten](https://github.com/kitten) (See [#3755](https://github.com/urql-graphql/urql/pull/3755))
- Updated dependencies (See [#3755](https://github.com/urql-graphql/urql/pull/3755))
  - @urql/core@5.1.1

## 0.1.1

### Patch Changes

- Add type for `hasNext` to the query and mutation results
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3703](https://github.com/urql-graphql/urql/pull/3703))

## 0.1.0

### Minor Changes

- Initial release
  Submitted by [@stefanmaric](https://github.com/stefanmaric) (See [#3607](https://github.com/urql-graphql/urql/pull/3607))

### Patch Changes

- Export Provider from the entry
  Submitted by [@XiNiHa](https://github.com/XiNiHa) (See [#3670](https://github.com/urql-graphql/urql/pull/3670))
- Correctly track query data reads with suspense
  Submitted by [@XiNiHa](https://github.com/XiNiHa) (See [#3672](https://github.com/urql-graphql/urql/pull/3672))
- feat(solid): reconcile data updates
  Submitted by [@XiNiHa](https://github.com/XiNiHa) (See [#3674](https://github.com/urql-graphql/urql/pull/3674))
