# Changelog

## 1.1.5

### Patch Changes

- Omit minified files and sourcemaps' `sourcesContent` in published packages
  Submitted by [@kitten](https://github.com/kitten) (See [#3755](https://github.com/urql-graphql/urql/pull/3755))

## 1.1.4

### Patch Changes

- Update Provider TSDoc to reflect our advice on
  instantiating the client within a React component
  Submitted by [@y-hsgw](https://github.com/y-hsgw) (See [#3748](https://github.com/urql-graphql/urql/pull/3748))

## 1.1.3

### Patch Changes

- Add type for hasNext to the query-state in urql-next
  Submitted by [@isy](https://github.com/isy) (See [#3707](https://github.com/urql-graphql/urql/pull/3707))

## 1.1.2

### Patch Changes

- export SSRContext from provider
  Submitted by [@ccummings](https://github.com/ccummings) (See [#3659](https://github.com/urql-graphql/urql/pull/3659))

## 1.1.1

### Patch Changes

- ⚠️ Fix `CVE-2024-24556`, addressing an XSS vulnerability, where `@urql/next` failed to escape HTML characters in JSON payloads injected into RSC hydration bodies. When an attacker is able to manipulate strings in the JSON response in RSC payloads, this could cause HTML to be evaluated via a typical XSS vulnerability (See [`GHSA-qhjf-hm5j-335w`](https://github.com/urql-graphql/urql/security/advisories/GHSA-qhjf-hm5j-335w) for details.)
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [`4b7011b7`](https://github.com/urql-graphql/urql/commit/4b7011b70d5718728ff912d02a4dbdc7f703540d))

## 1.1.0

### Minor Changes

- Support a `nonce` prop on `DataHydrationContextProvider` that passes it onto its script tags' attributes
  Submitted by [@Enalmada](https://github.com/Enalmada) (See [#3398](https://github.com/urql-graphql/urql/pull/3398))

### Patch Changes

- ⚠️ Fix invalid CJS by importing react with import-all semantics
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3405](https://github.com/urql-graphql/urql/pull/3405))

## 1.0.0

### Major Changes

- Create `@urql/next` which is a package meant to support Next 13 and
  the React 18 features contained within.
  For server components we have `@urql/next/rsc` and for client components
  just `@urql/next`
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3214](https://github.com/urql-graphql/urql/pull/3214))

## 5.0.2

### Patch Changes

- Switch `react` imports to namespace imports, and update build process for CommonJS outputs to interoperate with `__esModule` marked modules again
  Submitted by [@kitten](https://github.com/kitten) (See [#3251](https://github.com/urql-graphql/urql/pull/3251))

## 5.0.1

### Patch Changes

- Publish with npm provenance
  Submitted by [@kitten](https://github.com/kitten) (See [#3180](https://github.com/urql-graphql/urql/pull/3180))

## 5.0.0

### Patch Changes

- Add TSDocs to `@urql/*` packages
  Submitted by [@kitten](https://github.com/kitten) (See [#3079](https://github.com/urql-graphql/urql/pull/3079))
- Updated dependencies (See [#3053](https://github.com/urql-graphql/urql/pull/3053), [#3104](https://github.com/urql-graphql/urql/pull/3104), [#3095](https://github.com/urql-graphql/urql/pull/3095), [#3033](https://github.com/urql-graphql/urql/pull/3033), [#3103](https://github.com/urql-graphql/urql/pull/3103), and [#3079](https://github.com/urql-graphql/urql/pull/3079))
  - urql@4.0.0

## 4.0.3

### Patch Changes

- Add `pageProps: {}` entry to props on app components, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2909](https://github.com/urql-graphql/urql/pull/2909))

## 4.0.2

### Patch Changes

- ⚠️ Fix type-generation, with a change in TS/Rollup the type generation took the paths as src and resolved them into the types dir, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2870](https://github.com/urql-graphql/urql/pull/2870))

## 4.0.1

### Patch Changes

- Change import for `createClient` to `@urql/core`, which helps Next not depend on `urql` and hence not cause `createContext` to be called when the import is treeshaken away, by [@SleeplessOne1917](https://github.com/SleeplessOne1917) (See [#2833](https://github.com/urql-graphql/urql/pull/2833))

## 4.0.0

### Major Changes

- **Goodbye IE11!** 👋 This major release removes support for IE11. All code that is shipped will be transpiled much less and will _not_ be ES5-compatible anymore, by [@kitten](https://github.com/kitten) (See [#2504](https://github.com/FormidableLabs/urql/pull/2504))

### Patch Changes

- Updated dependencies (See [#2504](https://github.com/FormidableLabs/urql/pull/2504), [#2607](https://github.com/FormidableLabs/urql/pull/2607), and [#2504](https://github.com/FormidableLabs/urql/pull/2504))
  - urql@3.0.0

## 3.3.3

### Patch Changes

- ⚠️ Fix Node.js ESM re-export detection for `@urql/core` in `urql` package and CommonJS output for all other CommonJS-first packages. This ensures that Node.js' `cjs-module-lexer` can correctly identify re-exports and report them properly. Otherwise, this will lead to a runtime error, by [@kitten](https://github.com/kitten) (See [#2485](https://github.com/FormidableLabs/urql/pull/2485))

## 3.3.2

### Patch Changes

- Extend peer dependency range of `graphql` to include `^16.0.0`.
  As always when upgrading across many packages of `urql`, especially including `@urql/core` we recommend you to deduplicate dependencies after upgrading, using `npm dedupe` or `npx yarn-deduplicate`, by [@kitten](https://github.com/kitten) (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))

## 3.3.1

### Patch Changes

- ⚠️ Fix bail when the `getInitialProps` call indicates we've finished the response, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2101](https://github.com/FormidableLabs/urql/pull/2101))

## 3.3.0

### Minor Changes

- Support forwarding the getLayout function from pages, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2065](https://github.com/FormidableLabs/urql/pull/2065))

## 3.2.1

### Patch Changes

- ⚠️ Fix issue where the `renderToString` pass would keep looping due to reexecuting operations on the server, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1895](https://github.com/FormidableLabs/urql/pull/1895))

## 3.2.0

### Minor Changes

- Add new `staleWhileRevalidate` option from the `ssrExchange` addition to `withUrqlClient`'s options. This is useful when Next.js is used in static site generation (SSG) mode, by [@kitten](https://github.com/kitten) (See [#1852](https://github.com/FormidableLabs/urql/pull/1852))

### Patch Changes

- Use the built-in `next` types for next-urql HOC return values, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1812](https://github.com/FormidableLabs/urql/pull/1812))

## 3.1.1

### Patch Changes

- ⚠️ Fix `resetUrqlClient` not resetting the SSR cache itself and instead restoring data when all data related to this `Client` and session should've been deleted, by [@Biboswan](https://github.com/Biboswan) (See [#1715](https://github.com/FormidableLabs/urql/pull/1715))

## 3.1.0

### Minor Changes

- Allow subsequent static-pages to hydrate the cache, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1602](https://github.com/FormidableLabs/urql/pull/1602))

### Patch Changes

- Remove closure-compiler from the build step (See [#1570](https://github.com/FormidableLabs/urql/pull/1570))

## 3.0.1

### Patch Changes

- Ensure `urqlState` is hydrated onto the client when a user opts out of `ssr` and uses the `getServerSideProps` or `getStaticProps` on a page-level and `withUrqlClient` is wrapped on an `_app` level.
  Examples:
  - [getStaticProps](https://codesandbox.io/s/urql-get-static-props-dmjch?file=/pages/index.js)
  - [getServerSideProps](https://codesandbox.io/s/urql-get-static-props-forked-xfbrs?file=/pages/index.js), by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1501](https://github.com/FormidableLabs/urql/pull/1501))

## 3.0.0

### Patch Changes

- Updated dependencies (See [#1335](https://github.com/FormidableLabs/urql/pull/1335), [#1357](https://github.com/FormidableLabs/urql/pull/1357), and [#1374](https://github.com/FormidableLabs/urql/pull/1374))
  - urql@2.0.0

## 2.2.0

### Minor Changes

- Fix, update Next integration types so that they work with the newer `NextPage` typings, by [@wgolledge](https://github.com/wgolledge) (See [#1294](https://github.com/FormidableLabs/urql/pull/1294))

### Patch Changes

- ⚠️ Fix `withUrqlClient` fast-refresh detection, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1302](https://github.com/FormidableLabs/urql/pull/1302))

## 2.1.1

### Patch Changes

- ⚠️ Fix the production build overwriting the development build. Specifically in the previous release we mistakenly replaced all development bundles with production bundles. This doesn't have any direct influence on how these packages work, but prevented development warnings from being logged or full errors from being thrown, by [@kitten](https://github.com/kitten) (See [#1097](https://github.com/FormidableLabs/urql/pull/1097))
- Updated dependencies
  - urql@1.10.3

## 2.1.0

### Minor Changes

- Update `next-urql` types to be free-standing and not depend on the types from the `next` packages, by [@kitten](https://github.com/kitten) (See [#1095](https://github.com/FormidableLabs/urql/pull/1095))

### Patch Changes

- Updated dependencies (See [#1045](https://github.com/FormidableLabs/urql/pull/1045))
  - urql@1.10.2

## 2.0.0

This release moves `urql` from being in `dependencies` to `peerDependencies`. Please install it
explicitly, as you may have already in the past, and ensure that both `urql` and `@urql/core` are
not duplicated with either `npm dedupe` or `npx yarn-deduplicate`.

```sh
npm i --save urql
# or
yarn add urql
```

### Major Changes

- Move the `urql` dependency to a peer dependency.
- Remove the automatic polyfilling of `fetch` since this is done automatically starting at
  [`Next v9.4`](https://nextjs.org/blog/next-9-4#improved-built-in-fetch-support)
  If you are using a version before 9.4 you can upgrade by installing [`isomorphic-unfetch`](https://www.npmjs.com/package/isomorphic-unfetch)
  and importing it to polyfill the behavior, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#1018](https://github.com/FormidableLabs/urql/pull/1018))

## 1.2.0

### Minor Changes

- Add option called `neverSuspend` to disable `React.Suspense` on next.js, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#923](https://github.com/FormidableLabs/urql/pull/923))
- Expose `initUrqlClient` function so that a `Client` can be created manually for use in Next's newer SSR methods manually, such as `getServerSideProps`, by [@sunpietro](https://github.com/sunpietro) (See [#993](https://github.com/FormidableLabs/urql/pull/993))

## 1.1.0

### Minor Changes

- Add the option to reset the client on a next-urql application, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#894](https://github.com/FormidableLabs/urql/pull/894))

### Patch Changes

- Updated dependencies (See [#924](https://github.com/FormidableLabs/urql/pull/924) and [#904](https://github.com/FormidableLabs/urql/pull/904))
  - urql@1.10.0

## 1.0.2

### Patch Changes

- Disable suspense on the `Client` when we aren't using `react-ssr-prepass`, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#884](https://github.com/FormidableLabs/urql/pull/884))

## 1.0.1

### Patch Cho

0nges

- Prevent serialization of the `Client` for `withUrqlClient` even if the target component doesn't have a `getInitialProps` method. Before this caused the client to not be initialised correctly on the client-side, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#857](https://github.com/FormidableLabs/urql/pull/857))

## 1.0.0

To migrate to the new version, you will now have to pass a single function argument, instead
of two arguments to the `withUrqlClient` HOC helper. For instance, you would have to transform this:

```js
export default withUrqlClient(
  ctx => ({
    url: '',
  }),
  ssrExchange => [dedupExchange, cacheExchange, ssrExchange, fetchExchange]
);
```

To look like the following:

```js
export default withUrqlClient(
  (ssrExchange, ctx) => ({
    url: '',
    exchanges: [dedupExchange, cacheExchange, ssrExchange, fetchExchange],
  }),
  { ssr: true }
);
```

The second argument may now be used to pass `{ ssr: true }` explicitly, when you are
wrapping a page without another `getInitialProps` method. This gives you better support
when you implement custom methods like `getStaticProps`.

### Major Changes

- Change `getInitialProps` to be applied when the wrapped page `getInitialProps` or when `{ ssr: true }` is passed as a second options object. This is to better support alternative methods like `getStaticProps`. By [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#797](https://github.com/FormidableLabs/urql/pull/797))
- Update the `withUrqlClient` function to remove the second argument formerly called `mergeExchanges` and merges it with the first argument.

### Patch Changes

- Reuse the ssrExchange when there is one present on the client-side, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#855](https://github.com/FormidableLabs/urql/pull/855))
- Updated dependencies (See [#842](https://github.com/FormidableLabs/urql/pull/842))
  - urql@1.9.8

## 0.3.8

### Patch Changes

- Bump `react-ssr-prepass` so it can get eliminated in the client-side bundle, this because the 1.2.1 version added "sideEffects:false", by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#809](https://github.com/FormidableLabs/urql/pull/809))

## 0.3.7

### Patch Changes

- Ensure that the Next.js context is available during all stages of SSR. Previously a missing check in `useMemo` on the server-side caused `clientConfig` from being called repeatedly, and another issue may have caused the client from being serialized to initial props, by [@parkerziegler](https://github.com/parkerziegler) (See [#719](https://github.com/FormidableLabs/urql/pull/719))

## 0.3.6

### Patch Changes

- ⚠️ Fix bundling for packages depending on React, as it doesn't have native ESM bundles, by [@kitten](https://github.com/kitten) (See [#646](https://github.com/FormidableLabs/urql/pull/646))
- Updated dependencies (See [#646](https://github.com/FormidableLabs/urql/pull/646))
  - urql@1.9.4

## 0.3.5

### Patch Changes

- ⚠️ Fix node resolution when using Webpack, which experiences a bug where it only resolves
  `package.json:main` instead of `module` when an `.mjs` file imports a package, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#642](https://github.com/FormidableLabs/urql/pull/642))
- Updated dependencies (See [#642](https://github.com/FormidableLabs/urql/pull/642))
  - urql@1.9.3

## 0.3.4

### Patch Changes

- ⚠️ Fix Node.js Module support for v13 (experimental-modules) and v14. If your bundler doesn't support
  `.mjs` files and fails to resolve the new version, please double check your configuration for
  Webpack, or similar tools, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#637](https://github.com/FormidableLabs/urql/pull/637))
- Updated dependencies (See [#637](https://github.com/FormidableLabs/urql/pull/637))
  - urql@1.9.2

## 0.3.3

### Patch Changes

- ⚠️ Fix Rollup bundle output being written to .es.js instead of .esm.js, by [@kitten](https://github.com/kitten) (See [#609](https://github.com/FormidableLabs/urql/pull/609))

## 0.3.2

### Patch Changes

- Pass the `Client` down in `withUrqlClient.getInitialProps` to prevent it from being created twice, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#589](https://github.com/FormidableLabs/urql/pull/589))
- Add missing GraphQLError serialization for extensions and path field to ssrExchange, by [@kitten](https://github.com/kitten) (See [#607](https://github.com/FormidableLabs/urql/pull/607))
- Enable users to configure the `suspense` option and clean up suspense warning message, by [@ryan-gilb](https://github.com/ryan-gilb) (See [#603](https://github.com/FormidableLabs/urql/pull/603))

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

This release fixes a regression introduced in 0.2.0 involving circular structures created by `withUrqlClient`'s `getInitialProps` method.

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
