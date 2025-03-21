# @urql/introspection

## 1.2.1

### Patch Changes

- Omit minified files and sourcemaps' `sourcesContent` in published packages
  Submitted by [@kitten](https://github.com/kitten) (See [#3755](https://github.com/urql-graphql/urql/pull/3755))

## 1.2.0

### Minor Changes

- Add oneOf support
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3743](https://github.com/urql-graphql/urql/pull/3743))

## 1.1.0

### Minor Changes

- Mark `@urql/core` as a peer dependency as well as a regular dependency
  Submitted by [@kitten](https://github.com/kitten) (See [#3579](https://github.com/urql-graphql/urql/pull/3579))

## 1.0.3

### Patch Changes

- ⚠️ Fix `Any` type being included, even when it isn’t needed
  Submitted by [@kitten](https://github.com/kitten) (See [#3481](https://github.com/urql-graphql/urql/pull/3481))

## 1.0.2

### Patch Changes

- Publish with npm provenance
  Submitted by [@kitten](https://github.com/kitten) (See [#3180](https://github.com/urql-graphql/urql/pull/3180))

## 1.0.1

### Patch Changes

- Add TSDocs to `@urql/*` packages
  Submitted by [@kitten](https://github.com/kitten) (See [#3079](https://github.com/urql-graphql/urql/pull/3079))

## 1.0.0

### Major Changes

- **Goodbye IE11!** 👋 This major release removes support for IE11. All code that is shipped will be transpiled much less and will _not_ be ES5-compatible anymore, by [@kitten](https://github.com/kitten) (See [#2504](https://github.com/FormidableLabs/urql/pull/2504))

## 0.3.3

### Patch Changes

- Avoid making the imports of `@urql/introspection` more specific than they need to be, this because we aren't optimizing for bundle size and in pure node usage this can confuse Node as `import x from 'graphql'` won't share the same module scope as `import x from 'graphql/x/y.mjs'`, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2529](https://github.com/FormidableLabs/urql/pull/2529))

## 0.3.2

### Patch Changes

- ⚠️ Fix import of `executeSync` rather than `execute` causing an incompatibility when several `.mjs` imports and a main `import { executeSync } from 'graphql'` are causing two different modules to be instantiated, by [@kitten](https://github.com/kitten) (See [#2251](https://github.com/FormidableLabs/urql/pull/2251))

## 0.3.1

### Patch Changes

- Extend peer dependency range of `graphql` to include `^16.0.0`.
  As always when upgrading across many packages of `urql`, especially including `@urql/core` we recommend you to deduplicate dependencies after upgrading, using `npm dedupe` or `npx yarn-deduplicate`, by [@kitten](https://github.com/kitten) (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))

## 0.3.0

### Minor Changes

- Add options to `@urql/introspection`'s `minifyIntrospectionQuery` allowing the inclusion of more
  information into the minified schema as needed, namely `includeScalars`, `includeEnums`,
  `includeInputs`, and `includeDirectives`, by [@kitten](https://github.com/kitten) (See [#1578](https://github.com/FormidableLabs/urql/pull/1578))

### Patch Changes

- Remove closure-compiler from the build step (See [#1570](https://github.com/FormidableLabs/urql/pull/1570))

## 0.2.0

### Minor Changes

- Update `minifyIntrospectionQuery` utility to remove additional information on arguments and to filter out schema metadata types, like `__Field` and others, by [@kitten](https://github.com/kitten) (See [#1351](https://github.com/FormidableLabs/urql/pull/1351))

## 0.1.2

### Patch Changes

- ⚠️ Fix the `graphql` dependency being postfixed with `.mjs` when building the package, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1204](https://github.com/FormidableLabs/urql/pull/1204))

## 0.1.1

### Patch Changes

- Add missing `.mjs` extension to all imports from `graphql` to fix Webpack 5 builds, which require extension-specific import paths for ESM bundles and packages. **This change allows you to safely upgrade to Webpack 5.**, by [@kitten](https://github.com/kitten) (See [#1094](https://github.com/FormidableLabs/urql/pull/1094))

## 0.1.0

**Initial Release**
