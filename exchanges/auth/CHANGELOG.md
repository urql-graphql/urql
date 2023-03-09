# Changelog

## 2.0.0

### Major Changes

- Implement new `authExchange` API, which removes the need for an `authState` (i.e. an internal authentication state) and removes `getAuth`, replacing it with a separate `refreshAuth` flow.
  The new API requires you to now pass an initializer function. This function receives a `utils`
  object with `utils.mutate` and `utils.appendHeaders` utility methods.
  It must return the configuration object, wrapped in a promise, and this configuration is similar to
  what we had before, if you're migrating to this. Its `refreshAuth` method is now only called after
  authentication errors occur and not on initialization. Instead, it's now recommended that you write
  your initialization logic in-line.
  ```js
  authExchange(async utils => {
    let token = localStorage.getItem('token');
    let refreshToken = localStorage.getItem('refreshToken');
    return {
      addAuthToOperation(operation) {
        return utils.appendHeaders(operation, {
          Authorization: `Bearer ${token}`,
        });
      },
      didAuthError(error) {
        return error.graphQLErrors.some(
          e => e.extensions?.code === 'FORBIDDEN'
        );
      },
      async refreshAuth() {
        const result = await utils.mutate(REFRESH, { token });
        if (result.data?.refreshLogin) {
          token = result.data.refreshLogin.token;
          refreshToken = result.data.refreshLogin.refreshToken;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', refreshToken);
        }
      },
    };
  });
  ```
  Submitted by [@kitten](https://github.com/kitten) (See [#3012](https://github.com/urql-graphql/urql/pull/3012))

### Patch Changes

- ⚠️ Fix `willAuthError` not being called for operations that are waiting on the authentication state to update. This can actually lead to a common issue where operations that came in during the authentication initialization (on startup) will never have `willAuthError` called on them. This can cause an easy mistake where the initial authentication state is never checked to be valid
  Submitted by [@kitten](https://github.com/kitten) (See [#3017](https://github.com/urql-graphql/urql/pull/3017))
- Updated dependencies (See [#3007](https://github.com/urql-graphql/urql/pull/3007), [#2962](https://github.com/urql-graphql/urql/pull/2962), [#3007](https://github.com/urql-graphql/urql/pull/3007), [#3015](https://github.com/urql-graphql/urql/pull/3015), and [#3022](https://github.com/urql-graphql/urql/pull/3022))
  - @urql/core@3.2.0

## 1.0.0

### Major Changes

- **Goodbye IE11!** 👋 This major release removes support for IE11. All code that is shipped will be transpiled much less and will _not_ be ES5-compatible anymore, by [@kitten](https://github.com/kitten) (See [#2504](https://github.com/FormidableLabs/urql/pull/2504))
- Upgrade to [Wonka v6](https://github.com/0no-co/wonka) (`wonka@^6.0.0`), which has no breaking changes but is built to target ES2015 and comes with other minor improvements.
  The library has fully been migrated to TypeScript which will hopefully help with making contributions easier!, by [@kitten](https://github.com/kitten) (See [#2504](https://github.com/FormidableLabs/urql/pull/2504))

### Minor Changes

- Remove the `babel-plugin-modular-graphql` helper, this because the graphql package hasn't converted to ESM yet which gives issues in node environments, by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#2551](https://github.com/FormidableLabs/urql/pull/2551))

### Patch Changes

- Updated dependencies (See [#2551](https://github.com/FormidableLabs/urql/pull/2551), [#2504](https://github.com/FormidableLabs/urql/pull/2504), [#2619](https://github.com/FormidableLabs/urql/pull/2619), [#2607](https://github.com/FormidableLabs/urql/pull/2607), and [#2504](https://github.com/FormidableLabs/urql/pull/2504))
  - @urql/core@3.0.0

## 0.1.7

### Patch Changes

- Extend peer dependency range of `graphql` to include `^16.0.0`.
  As always when upgrading across many packages of `urql`, especially including `@urql/core` we recommend you to deduplicate dependencies after upgrading, using `npm dedupe` or `npx yarn-deduplicate`, by [@kitten](https://github.com/kitten) (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
- Updated dependencies (See [#2133](https://github.com/FormidableLabs/urql/pull/2133))
  - @urql/core@2.3.6

## 0.1.6

### Patch Changes

- ⚠️ Fix willAuthError causing duplicate operations, by [@yankovalera](https://github.com/yankovalera) (See [#1849](https://github.com/FormidableLabs/urql/pull/1849))
- Updated dependencies (See [#1851](https://github.com/FormidableLabs/urql/pull/1851), [#1850](https://github.com/FormidableLabs/urql/pull/1850), and [#1852](https://github.com/FormidableLabs/urql/pull/1852))
  - @urql/core@2.2.0

## 0.1.5

### Patch Changes

- Expose `AuthContext` type, by [@arempe93](https://github.com/arempe93) (See [#1828](https://github.com/FormidableLabs/urql/pull/1828))
- Updated dependencies (See [#1829](https://github.com/FormidableLabs/urql/pull/1829))
  - @urql/core@2.1.6

## 0.1.4

### Patch Changes

- Allow `mutate` to infer the result's type when a `TypedDocumentNode` is passed via the usual generics, like `client.mutation` for instance, by [@younesmln](https://github.com/younesmln) (See [#1796](https://github.com/FormidableLabs/urql/pull/1796))

## 0.1.3

### Patch Changes

- Remove closure-compiler from the build step (See [#1570](https://github.com/FormidableLabs/urql/pull/1570))
- Updated dependencies (See [#1570](https://github.com/FormidableLabs/urql/pull/1570), [#1509](https://github.com/FormidableLabs/urql/pull/1509), [#1600](https://github.com/FormidableLabs/urql/pull/1600), and [#1515](https://github.com/FormidableLabs/urql/pull/1515))
  - @urql/core@2.1.0

## 0.1.2

### Patch Changes

- Deprecate the `Operation.operationName` property in favor of `Operation.kind`. This name was
  previously confusing as `operationName` was effectively referring to two different things. You can
  safely upgrade to this new version, however to mute all deprecation warnings you will have to
  **upgrade** all `urql` packages you use. If you have custom exchanges that spread operations, please
  use [the new `makeOperation` helper
  function](https://formidable.com/open-source/urql/docs/api/core/#makeoperation) instead, by [@bkonkle](https://github.com/bkonkle) (See [#1045](https://github.com/FormidableLabs/urql/pull/1045))
- Updated dependencies (See [#1094](https://github.com/FormidableLabs/urql/pull/1094) and [#1045](https://github.com/FormidableLabs/urql/pull/1045))
  - @urql/core@1.14.0

## 0.1.1

### Patch Changes

- ⚠️ Fix an operation that triggers `willAuthError` with a truthy return value being sent off twice, by [@kitten](https://github.com/kitten) (See [#1075](https://github.com/FormidableLabs/urql/pull/1075))

## v0.1.0

**Initial Release**
