# @urql/core

## 1.11.7

### Patch Changes

- Add `source` debug name to all `dispatchDebug` calls during build time to identify events by which exchange dispatched them, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#780](https://github.com/FormidableLabs/urql/pull/780))

## 1.11.6

### Patch Changes

- Add a `"./package.json"` entry to the `package.json`'s `"exports"` field for Node 14. This seems to be required by packages like `rollup-plugin-svelte` to function properly, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#771](https://github.com/FormidableLabs/urql/pull/771))

## 1.11.5

### Patch Changes

- Hoist variables in unminified build output for Metro Bundler builds which otherwise fails for `process.env.NODE_ENV` if-clauses, by [@kitten](https://github.com/kitten) (See [#737](https://github.com/FormidableLabs/urql/pull/737))
- Add a babel-plugin that removes empty imports from the final build output, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#735](https://github.com/FormidableLabs/urql/pull/735))

## 1.11.4

### Patch Changes

Sorry for the many updates; Please only upgrade to `>=1.11.4` and don't use the deprecated `1.11.3`
and `1.11.2` release.

- ⚠️ Fix nested package path for @urql/core/internal and @urql/exchange-graphcache/extras, by [@kitten](https://github.com/kitten) (See [#734](https://github.com/FormidableLabs/urql/pull/734))

## 1.11.3

### Patch Changes

- Make the extension of the main export unknown, which fixes a Webpack issue where the resolver won't pick `module` fields in `package.json` files once it's importing from another `.mjs` file, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#733](https://github.com/FormidableLabs/urql/pull/733))

## 1.11.1

### Patch Changes

- ⚠️ Fix missing `@urql/core/internal` entrypoint in the npm-release, which was previously not included, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#731](https://github.com/FormidableLabs/urql/pull/731))

## 1.11.0

### Minor Changes

- Add debugging events to exchanges that add more detailed information on what is happening
  internally, which will be displayed by devtools like the urql [Chrome / Firefox extension](https://github.com/FormidableLabs/urql-devtools), by [@andyrichardson](https://github.com/andyrichardson) (See [#608](https://github.com/FormidableLabs/urql/pull/608))
- Add @urql/core/internal entrypoint for internally shared utilities and start sharing fetchExchange-related code, by [@kitten](https://github.com/kitten) (See [#722](https://github.com/FormidableLabs/urql/pull/722))

### Patch Changes

- ⚠️ Fix stringifyVariables breaking on x.toJSON scalars, by [@kitten](https://github.com/kitten) (See [#718](https://github.com/FormidableLabs/urql/pull/718))

## 1.10.9

### Patch Changes

- Pick modules from graphql package, instead of importing from graphql/index.mjs, by [@kitten](https://github.com/kitten) (See [#700](https://github.com/FormidableLabs/urql/pull/700))

## 1.10.8

### Patch Changes

- Add graphql@^15.0.0 to peer dependency range, by [@kitten](https://github.com/kitten) (See [#688](https://github.com/FormidableLabs/urql/pull/688))
- ⚠️ Fix non-2xx results never being parsed as GraphQL results. This can result in valid GraphQLErrors being hidden, which should take precedence over generic HTTP NetworkErrors, by [@kitten](https://github.com/kitten) (See [#678](https://github.com/FormidableLabs/urql/pull/678))

## 1.10.7

### Patch Changes

- ⚠️ Fix oversight in edge case for #662. The operation queue wasn't marked as being active which caused `stale` results and `cache-and-network` operations from reissuing operations immediately (unqueued essentially) which would then be filtered out by the `dedupExchange`, by [@kitten](https://github.com/kitten) (See [#669](https://github.com/FormidableLabs/urql/pull/669))

## 1.10.6

### Patch Changes

- ⚠️ Fix critical bug in operation queueing that can lead to unexpected teardowns and swallowed operations. This would happen when a teardown operation kicks off the queue, by [@kitten](https://github.com/kitten) (See [#662](https://github.com/FormidableLabs/urql/pull/662))

## 1.10.5

### Patch Changes

- Refactor a couple of core helpers for minor bundlesize savings, by [@kitten](https://github.com/kitten) (See [#658](https://github.com/FormidableLabs/urql/pull/658))
- Add support for variables that contain non-plain objects without any enumerable keys, e.g. `File` or `Blob`. In this case `stringifyVariables` will now use a stable (but random) key, which means that mutations containing `File`s — or other objects like this — will now be distinct, as they should be, by [@kitten](https://github.com/kitten) (See [#650](https://github.com/FormidableLabs/urql/pull/650))

## 1.10.4

### Patch Changes

- ⚠️ Fix node resolution when using Webpack, which experiences a bug where it only resolves
  `package.json:main` instead of `module` when an `.mjs` file imports a package, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#642](https://github.com/FormidableLabs/urql/pull/642))

## 1.10.3

### Patch Changes

- ⚠️ Fix Node.js Module support for v13 (experimental-modules) and v14. If your bundler doesn't support
  `.mjs` files and fails to resolve the new version, please double check your configuration for
  Webpack, or similar tools, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#637](https://github.com/FormidableLabs/urql/pull/637))

## 1.10.2

### Patch Changes

- Add a guard to "maskTypenames" so a null value isn't considered an object, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#621](https://github.com/FormidableLabs/urql/pull/621))

## 1.10.1

### Patch Changes

- ⚠️ Fix Rollup bundle output being written to .es.js instead of .esm.js, by [@kitten](https://github.com/kitten) (See [#609](https://github.com/FormidableLabs/urql/pull/609))

## 1.10.0

### Minor Changes

- Add `additionalTypenames` to the `OperationContext`, which allows the document cache to invalidate efficiently when the `__typename` is unknown at the initial fetch, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#601](https://github.com/FormidableLabs/urql/pull/601)) [You can learn more about this change in our docs.](https://formidable.com/open-source/urql/docs/basics/document-caching/#adding-typenames)

### Patch Changes

- Add missing GraphQLError serialization for extensions and path field to ssrExchange, by [@kitten](https://github.com/kitten) (See [#607](https://github.com/FormidableLabs/urql/pull/607))

## 1.9.2

### Patch Changes

- Prevent active teardowns for queries on subscriptionExchange, by [@kitten](https://github.com/kitten) (See [#577](https://github.com/FormidableLabs/urql/pull/577))

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
