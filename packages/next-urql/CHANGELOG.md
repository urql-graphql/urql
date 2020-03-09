# Changelog

## 0.3.1

### Patch Changes

- Remove type import from internal urql package file that has been removed, by [@parkerziegler](https://github.com/parkerziegler) (See [#557](https://github.com/FormidableLabs/urql/pull/557))
- Ensure empty object gets returned in withUrqlClient's getInitialProps. Update next-urql examples to run in the urql monorepo, by [@parkerziegler](https://github.com/parkerziegler) (See [#563](https://github.com/FormidableLabs/urql/pull/563))

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.3.0

This release adds support for different `urql` Client configurations between the client-side and the server-side when using `next-urql`.

**Warning:** To support this, access to Next's context object, `ctx`, **can only happen on the server**.

### Added

- An example showing how to use a custom exchange with `next-urql`. PR by @ryan-gilb [here](https://github.com/FormidableLabs/next-urql/pull/32).
- Instructions for using `next-urql` with ReasonML. PR by @parkerziegler [here](https://github.com/FormidableLabs/next-urql/pull/28).

### Fixed

- `clientOptions` are no longer serialized inside of `withUrql`'s `getInitialProps` method. This ensures that users can use different Client configurations between the client and server. PR by @parkerziegler [here](https://github.com/FormidableLabs/next-urql/pull/33).
- Proper support for forwarding `pageProps` when using `withUrqlClient` with an `_app.js` component. The `urql` Client instance is also attached to `ctx` for `_app.js` `getInitialProps`. PR by @parkerziegler [here](https://github.com/FormidableLabs/next-urql/pull/38).
- `react-ssr-prepass` dependency upgraded to `1.1.2` to support `urql` `>= 1.9.0`. PR by @JoviDeCroock [here](https://github.com/FormidableLabs/next-urql/pull/37).

### Diff

https://github.com/FormidableLabs/next-urql/compare/v0.2.5...v0.3.0

## 0.2.5

This release encompasses small changes to our TypeScript definitions for `next-urql`, with an upgrade to using `next@9` as the basis for new type definitions in lieu of `@types/next`. The examples were also converted over to TypeScript from JavaScript.

### Added

- All example projects now use TypeScript 🎉 PRs by @ryan-gilb [here](https://github.com/FormidableLabs/next-urql/pull/19) and [here](https://github.com/FormidableLabs/next-urql/pull/21). This gives us stronger guarantees around library types.

### Fixed

- Upgraded type definitions to use types from `next@9`. PR by @ryan-gilb [here](https://github.com/FormidableLabs/next-urql/pull/22). If accessing the `NextContextWithAppTree` `interface`, the name has changed to `NextUrqlContext`.

### Diff

https://github.com/FormidableLabs/next-urql/compare/v0.2.4...v0.2.5

## 0.2.4

This release adds support for accessing the `urqlClient` instance off of Next's context object.

### Added

- `urqlClient` is now added to Next's context object, `ctx`, such that it can be accessed by other components lower in the tree. PR by @BjoernRave [here](https://github.com/FormidableLabs/next-urql/pull/15).

### Diff

https://github.com/FormidableLabs/next-urql/compare/v0.2.3...v0.2.4

## 0.2.3

This release fixes support for using `withUrqlClient` with `_app.js`.

### Added

- Examples are now separated into an `examples` directory. The first, `1-with-urql-client`, shows recommended usage by wrapping a Page component, while the second, `2-with-_app.js` shows how to set up `next-urql` with `_app.js`.

### Fixed

- Be sure to check for `urqlClient` in both direct props and `pageProps` to handle `_app.js` usage with `withUrqlClient`. PR by @bmathews and @parkerziegler [here](https://github.com/FormidableLabs/next-urql/pull/13).

### Diff

https://github.com/FormidableLabs/next-urql/compare/v0.2.2...v0.2.3

## 0.2.2

This release fixes a small discrepancy in the types used by `withUrqlClient` and the public API defined by our `index.d.ts` file.

### Fixed

- Use `NextUrqlClientConfig` in lieu of `NextUrqlClientOptions` in `index.d.ts` to match implementation of `withUrqlClient`. PR by @kylealwyn [here](https://github.com/FormidableLabs/next-urql/pull/9).

### Diff

https://github.com/FormidableLabs/next-urql/compare/v0.2.1...v0.2.2

## 0.2.1

This release fixes a regression introduced in 0.2.0 involving circular structures created bt `withUrqlClient`'s `getInitialProps` method.

### Fixed

- Amend circular structure in `withUrqlClient` caused by returning `ctx` in `getInitialProps`. PR by @parkerziegler [here](https://github.com/FormidableLabs/next-urql/pull/7).
- Fix dependency resolution issues in the `example` project. Update `example` documentation. PR by @parkerziegler [here](https://github.com/FormidableLabs/next-urql/pull/7).

### Diff

https://github.com/FormidableLabs/next-urql/compare/v0.2.0...v0.2.1

## 0.2.0 [Deprecated]

This release adds support for accessing Next's context object, `ctx`, to instantiate your `urql` Client instance.

### Added

- Support for accessing Next's context object, `ctx`, when initializing `withUrqlClient` and creating client options. This should assist users who need to access some data stored in `ctx` to instantiate their `urql` Client instance. PR by @parkerziegler [here](https://github.com/FormidableLabs/next-urql/pull/4).

### Diff

https://github.com/FormidableLabs/next-urql/compare/v0.1.1...v0.2.0

## 0.1.1

This release adds TypeScript definitions to `next-urql`, alongside important pieces like a License (MIT), and improved documentation for users and contributors.

### Added

- TypeScript definitions for the public API of `next-urql` now ship with the library. PR by @parkerziegler [here](https://github.com/FormidableLabs/next-urql/pull/2).
- MIT License.
- Improved README documentation around `withUrqlClient` usage.
- CONTRIBUTING.md to help new contributors to the project get involved.

### Diff

https://github.com/FormidableLabs/next-urql/compare/v0.1.0...v0.1.1

## 0.1.0

This is the initial release of `next-urql` in its Beta API. The package is not meant to be consumed yet, and this purely serves as a prerelease for local testing.
