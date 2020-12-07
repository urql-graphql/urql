# @urql/introspection

## 0.1.2

### Patch Changes

- ⚠️ Fix the `graphql` dependency being postfixed with `.mjs` when building the package, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1204](https://github.com/FormidableLabs/urql/pull/1204))

## 0.1.1

### Patch Changes

- Add missing `.mjs` extension to all imports from `graphql` to fix Webpack 5 builds, which require extension-specific import paths for ESM bundles and packages. **This change allows you to safely upgrade to Webpack 5.**, by [@kitten](https://github.com/kitten) (See [#1094](https://github.com/FormidableLabs/urql/pull/1094))

## 0.1.0

**Initial Release**
