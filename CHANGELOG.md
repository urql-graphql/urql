# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.4] - 2020-01-08

This release adds support for accessing the `urqlClient` instance off of Next's context object.

### Added

- `urqlClient` is now added to Next's context object, `ctx`, such that it can be accessed by other components lower in the tree. PR by @BjoernRave [here](https://github.com/FormidableLabs/next-urql/pull/15).

### Diff

https://github.com/FormidableLabs/next-urql/compare/v0.2.3...v0.2.4

## [0.2.3] - 2019-12-31

This release fixes support for using `withUrqlClient` with `_app.js`.

### Added

- Examples are now separated into an `examples` directory. The first, `1-with-urql-client`, shows recommended usage by wrapping a Page component, while the second, `2-with-_app.js` shows how to set up `next-urql` with `_app.js`.

### Fixed

- Be sure to check for `urqlClient` in both direct props and `pageProps` to handle `_app.js` usage with `withUrqlClient`. PR by @bmathews and @parkerziegler [here](https://github.com/FormidableLabs/next-urql/pull/13).

### Diff

https://github.com/FormidableLabs/next-urql/compare/v0.2.2...v0.2.3

## [0.2.2] - 2019-12-17

This release fixes a small discrepancy in the types used by `withUrqlClient` and the public API defined by our `index.d.ts` file.

### Fixed

- Use `NextUrqlClientConfig` in lieu of `NextUrqlClientOptions` in `index.d.ts` to match implementation of `withUrqlClient`. PR by @kylealwyn [here](https://github.com/FormidableLabs/next-urql/pull/9).

### Diff

https://github.com/FormidableLabs/next-urql/compare/v0.2.1...v0.2.2

## [0.2.1] - 2019-12-17

This release fixes a regression introduced in 0.2.0 involving circular structures created bt `withUrqlClient`'s `getInitialProps` method.

### Fixed

- Amend circular structure in `withUrqlClient` caused by returning `ctx` in `getInitialProps`. PR by @parkerziegler [here](https://github.com/FormidableLabs/next-urql/pull/7).
- Fix dependency resolution issues in the `example` project. Update `example` documentation. PR by @parkerziegler [here](https://github.com/FormidableLabs/next-urql/pull/7).

### Diff

https://github.com/FormidableLabs/next-urql/compare/v0.2.0...v0.2.1

## [0.2.0] - 2019-12-08 [Deprecated]

This release adds support for accessing Next's context object, `ctx`, to instantiate your `urql` Client instance.

### Added

- Support for accessing Next's context object, `ctx`, when initializing `withUrqlClient` and creating client options. This should assist users who need to access some data stored in `ctx` to instantiate their `urql` Client instance. PR by @parkerziegler [here](https://github.com/FormidableLabs/next-urql/pull/4).

### Diff

https://github.com/FormidableLabs/next-urql/compare/v0.1.1...v0.2.0

## [0.1.1] - 2019-11-11

This release adds TypeScript definitions to `next-urql`, alongside important pieces like a License (MIT), and improved documentation for users and contributors.

### Added

- TypeScript definitions for the public API of `next-urql` now ship with the library. PR by @parkerziegler [here](https://github.com/FormidableLabs/next-urql/pull/2).
- MIT License.
- Improved README documentation around `withUrqlClient` usage.
- CONTRIBUTING.md to help new contributors to the project get involved.

### Diff

https://github.com/FormidableLabs/next-urql/compare/v0.1.0...v0.1.1

## [0.1.0] - 2019-11-02

This is the initial release of `next-urql` in its Beta API. The package is not meant to be consumed yet, and this purely serves as a prerelease for local testing.
