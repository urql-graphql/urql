# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## UNRELEASED

- Support for accessing Next's context object, `ctx`, when initializing `withUrqlClient` and creating `clientOptions`. This should assist users wanting to do authorization based on some value stored in `ctx`.

## [0.1.1] - 2019-11-11

### Added

- TypeScript definitions for the public API of `next-urql` now ship with the library. PR by @parkerziegler [here](https://github.com/FormidableLabs/next-urql/pull/2).
- MIT License.
- Improved README documentation around `withUrqlClient` usage.
- CONTRIBUTING.md to help new contributors to the project get involved.

## [0.1.0] - 2019-11-02

This is the initial release of `next-urql` in its Beta API. The API is subject to change significantly before the 1.0 release, although we don't expect it to.
