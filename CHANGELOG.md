# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2019-12-08

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
