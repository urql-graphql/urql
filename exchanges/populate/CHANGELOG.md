# @urql/exchange-populate

## 0.1.3

### Patch Changes

- ⚠️ Fix node resolution when using Webpack, which experiences a bug where it only resolves
  `package.json:main` instead of `module` when an `.mjs` file imports a package, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#642](https://github.com/FormidableLabs/urql/pull/642))
- Updated dependencies (See [#642](https://github.com/FormidableLabs/urql/pull/642))
  - @urql/core@1.10.4

## 0.1.2

### Patch Changes

- ⚠️ Fix Node.js Module support for v13 (experimental-modules) and v14. If your bundler doesn't support
  `.mjs` files and fails to resolve the new version, please double check your configuration for
  Webpack, or similar tools, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#637](https://github.com/FormidableLabs/urql/pull/637))
- Updated dependencies (See [#637](https://github.com/FormidableLabs/urql/pull/637))
  - @urql/core@1.10.3

## 0.1.1

### Patch Changes

- Remove the shared package, this will fix the types file generation for graphcache, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#579](https://github.com/FormidableLabs/urql/pull/579))
- Updated dependencies (See [#577](https://github.com/FormidableLabs/urql/pull/577))
  - @urql/core@1.9.2

## 0.1.0

### Initial release

- Moved the `populateExchange` from `@urql/exchange-graphcache` to its own package.
