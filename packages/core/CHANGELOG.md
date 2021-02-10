# @urql/core

## 2.0.0

### Major Changes

- **Breaking**: Remove `pollInterval` feature from `OperationContext`. Instead consider using a source that uses `Wonka.interval` and `Wonka.switchMap` over `client.query()`'s source, by [@kitten](https://github.com/kitten) (See [#1374](https://github.com/FormidableLabs/urql/pull/1374))
- Remove deprecated `operationName` property from `Operation`s. The new `Operation.kind` property is now preferred. If you're creating new operations you may also use the `makeOperation` utility instead.
  When upgrading `@urql/core` please ensure that your package manager didn't install any duplicates of it. You may deduplicate it manually using `npx yarn-deduplicate` (for Yarn) or `npm dedupe` (for npm), by [@kitten](https://github.com/kitten) (See [#1357](https://github.com/FormidableLabs/urql/pull/1357))

### Minor Changes

- Reemit an `OperationResult` as `stale: true` if it's being reexecuted as `network-only` operation to give bindings immediate feedback on background refetches, by [@kitten](https://github.com/kitten) (See [#1375](https://github.com/FormidableLabs/urql/pull/1375))

## 1.16.2

### Patch Changes

- Add a workaround for `graphql-tag/loader`, which provides filtered query documents (where the original document contains multiple operations) without updating or providing a correct `document.loc.source.body` string, by [@kitten](https://github.com/kitten) (See [#1315](https://github.com/FormidableLabs/urql/pull/1315))

## 1.16.1

### Patch Changes

- Add fragment deduplication to `gql` tag. Identical fragments can now be interpolated multiple times without a warning being triggered or them being duplicated in `gql`'s output, by [@kitten](https://github.com/kitten) (See [#1225](https://github.com/FormidableLabs/urql/pull/1225))

## 1.16.0

### Minor Changes

- Add a built-in `gql` tag function helper to `@urql/core`. This behaves similarly to `graphql-tag` but only warns about _locally_ duplicated fragment names rather than globally. It also primes `@urql/core`'s key cache with the parsed `DocumentNode`, by [@kitten](https://github.com/kitten) (See [#1187](https://github.com/FormidableLabs/urql/pull/1187))

### Patch Changes

- ⚠️ Fix edge case in `formatDocument`, which fails to add a `__typename` field if it has been aliased to a different name, by [@kitten](https://github.com/kitten) (See [#1186](https://github.com/FormidableLabs/urql/pull/1186))
- Cache results of `formatDocument` by the input document's key, by [@kitten](https://github.com/kitten) (See [#1186](https://github.com/FormidableLabs/urql/pull/1186))

## 1.15.2

### Patch Changes

- Don't add `undefined` to any property of the `ssrExchange`'s serialized results, as this would crash in Next.js, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1168](https://github.com/FormidableLabs/urql/pull/1168))

## 1.15.1

### Patch Changes

- Export `getOperationName` from `@urql/core` and use it in `@urql/exchange-execute`, fixing several imports, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1135](https://github.com/FormidableLabs/urql/pull/1135))

## 1.15.0

### Minor Changes

- Improve the Suspense implementation, which fixes edge-cases when Suspense is used with subscriptions, partially disabled, or _used on the client-side_. It has now been ensured that client-side suspense functions without the deprecated `suspenseExchange` and uncached results are loaded consistently. As part of this work, the `Client` itself does now never throw Suspense promises anymore, which is functionality that either way has no place outside of the React/Preact bindings, by [@kitten](https://github.com/kitten) (See [#1123](https://github.com/FormidableLabs/urql/pull/1123))

### Patch Changes

- Use `Record` over `object` type for subscription operation variables. The `object` type is currently hard to use ([see this issue](https://github.com/microsoft/TypeScript/issues/21732)), by [@enisdenjo](https://github.com/enisdenjo) (See [#1119](https://github.com/FormidableLabs/urql/pull/1119))
- Add support for `TypedDocumentNode` to infer the type of the `OperationResult` and `Operation` for all methods, functions, and hooks that either directly or indirectly accept a `DocumentNode`. See [`graphql-typed-document-node` and the corresponding blog post for more information.](https://github.com/dotansimha/graphql-typed-document-node), by [@kitten](https://github.com/kitten) (See [#1113](https://github.com/FormidableLabs/urql/pull/1113))
- Refactor `useSource` hooks which powers `useQuery` and `useSubscription` to improve various edge case behaviour. This will not change the behaviour of these hooks dramatically but avoid unnecessary state updates when any updates are obviously equivalent and the hook will furthermore improve continuation from mount to effects, which will fix cases where the state between the mounting and effect phase may slightly change, by [@kitten](https://github.com/kitten) (See [#1104](https://github.com/FormidableLabs/urql/pull/1104))

## 1.14.1

### Patch Changes

- ⚠️ Fix the production build overwriting the development build. Specifically in the previous release we mistakenly replaced all development bundles with production bundles. This doesn't have any direct influence on how these packages work, but prevented development warnings from being logged or full errors from being thrown, by [@kitten](https://github.com/kitten) (See [#1097](https://github.com/FormidableLabs/urql/pull/1097))

## 1.14.0

This version of `@urql/core` renames `Operation.operationName` to `Operation.kind`. For now the old
property is merely deprecated and will issue a warning if it's used directly. That said, all
exchanges that are released today also need this new version of `@urql/core@>=1.14.0`, so if you
upgrade to any of the following packages, you will also need to upgrade `@urql/core`. If you upgrade
and see the deprecation warning, check whether all following exchanges have been upgraded:

- `@urql/exchange-auth@0.1.2`
- `@urql/exchange-execute@1.0.2`
- `@urql/exchange-graphcache@3.1.8`
- `@urql/exchange-multipart-fetch@0.1.10`
- `@urql/exchange-persisted-fetch@1.2.2`
- `@urql/exchange-populate@0.2.1`
- `@urql/exchange-refocus@0.2.1`
- `@urql/exchange-retry@0.1.9`
- `@urql/exchange-suspense@1.9.2`

Once you've upgraded `@urql/core` please also ensure that your package manager hasn't accidentally
duplicated the `@urql/core` package. If you're using `npm` you can do so by running `npm dedupe`,
and if you use `yarn` you can do so by running `yarn-deduplicate`.

If you have a custom exchange, you can mute the deprecation warning by using `Operation.kind` rather
than `Operation.operationName`. If these exchanges are copying or altering operations by spreading
them this will also trigger the warning, which you can fix by using [the new `makeOperation` helper
function.](https://formidable.com/open-source/urql/docs/api/core/#makeoperation)

### Minor Changes

- Deprecate the `Operation.operationName` property in favor of `Operation.kind`. This name was
  previously confusing as `operationName` was effectively referring to two different things. You can
  safely upgrade to this new version, however to mute all deprecation warnings you will have to
  **upgrade** all `urql` packages you use. If you have custom exchanges that spread operations, please
  use [the new `makeOperation` helper
  function](https://formidable.com/open-source/urql/docs/api/core/#makeoperation) instead, by [@bkonkle](https://github.com/bkonkle) (See [#1045](https://github.com/FormidableLabs/urql/pull/1045))

### Patch Changes

- Add missing `.mjs` extension to all imports from `graphql` to fix Webpack 5 builds, which require extension-specific import paths for ESM bundles and packages. **This change allows you to safely upgrade to Webpack 5.**, by [@kitten](https://github.com/kitten) (See [#1094](https://github.com/FormidableLabs/urql/pull/1094))

## 1.13.1

### Patch Changes

- Allow `client.reexecuteOperation` to be called with mutations which skip the active operation minimums, by [@kitten](https://github.com/kitten) (See [#1011](https://github.com/FormidableLabs/urql/pull/1011))

## 1.13.0

Please note that this release changes the data structure of the `ssrExchange`'s
output. We don't treat this as a breaking change, since this data is considered
a private structure, but if your tests or other code relies on this, please check
the type changes and update it.

### Minor Changes

- Adds an error exchange to urql-core. This allows tapping into all graphql errors within the urql client. Useful for logging, debugging, handling authentication errors etc, by [@kadikraman](https://github.com/kadikraman) (See [#947](https://github.com/FormidableLabs/urql/pull/947))

### Patch Changes

- ⚠️ Fix condition where mutated result data would be picked up by the `ssrExchange`, for instance as a result of mutations by Graphcache. Instead the `ssrExchange` now serializes data early, by [@kitten](https://github.com/kitten) (See [#962](https://github.com/FormidableLabs/urql/pull/962))
- Omit the `Content-Type: application/json` HTTP header when using GET in the `fetchExchange`, `persistedFetchExchange`, or `multipartFetchExchange`, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#957](https://github.com/FormidableLabs/urql/pull/957))

## 1.12.3

### Patch Changes

- Remove whitespace and comments from string-queries, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#911](https://github.com/FormidableLabs/urql/pull/911))
- Remove redundant whitespaces when using GET for graphql queries, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#908](https://github.com/FormidableLabs/urql/pull/908))

## 1.12.2

### Patch Changes

- ⚠️ Fix `formatDocument` mutating parts of the `DocumentNode` which may be shared by other documents and queries. Also ensure that a formatted document will always generate the same key in `createRequest` as the original document, by [@kitten](https://github.com/kitten) (See [#880](https://github.com/FormidableLabs/urql/pull/880))
- ⚠️ Fix `ssrExchange` invalidating results on the client-side too eagerly, by delaying invalidation by a tick, by [@kitten](https://github.com/kitten) (See [#885](https://github.com/FormidableLabs/urql/pull/885))

## 1.12.1

### Patch Changes

- ⚠️ Fix timing for out-of-band `client.reexecuteOperation` calls. This would surface in asynchronous caching scenarios, where no result would be delivered by the cache synchronously, while it still calls `client.reexecuteOperation` for e.g. a `network-only` request, which happens for `cache-and-network`. This issue becomes especially obvious in highly synchronous frameworks like Svelte, by [@kitten](https://github.com/kitten) (See [#860](https://github.com/FormidableLabs/urql/pull/860))
- Replace unnecessary `scheduleTask` polyfill with inline `Promise.resolve().then(fn)` calls, by [@kitten](https://github.com/kitten) (See [#861](https://github.com/FormidableLabs/urql/pull/861))

## 1.12.0

As always, please ensure that you deduplicate `@urql/core` when upgrading. Additionally
deduplicating the versions of `wonka` that you have installed may also reduce your bundlesize.

### Minor Changes

- Expose a `client.subscription` shortcut method, similar to `client.query` and `client.mutation`, by [@FredyC](https://github.com/FredyC) (See [#838](https://github.com/FormidableLabs/urql/pull/838))

### Patch Changes

- Upgrade to a minimum version of wonka@^4.0.14 to work around issues with React Native's minification builds, which use uglify-es and could lead to broken bundles, by [@kitten](https://github.com/kitten) (See [#842](https://github.com/FormidableLabs/urql/pull/842))

## 1.11.8

### Patch Changes

- Add operationName to GET queries, by [@jakubriedl](https://github.com/jakubriedl) (See [#798](https://github.com/FormidableLabs/urql/pull/798))

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
