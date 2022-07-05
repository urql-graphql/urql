# @urql/introspection

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
