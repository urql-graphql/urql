---
title: @urql/exchange-graphcache
order: 3
---

# @urql/exchange-graphcache

The `@urql/exchange-graphcache` package contains an addon `cacheExchange` for `urql` that may be
used to replace the default [`cacheExchange`](./core.md#cacheexchange), which switches `urql` from
using ["Document Caching"](../basics/document-caching.md) to ["Normalized
Caching"](../graphcache/normalized-caching.md).

[Read more about how to use and configure _Graphcache_ in the "Graphcache"
section](../graphcache/README.md)

## cacheExchange

The `cacheExchange` function, as exported by `@urql/exchange-graphcache`, accepts a single object of
options and returns an [`Exchange`](./core.md#exchange).

| Input        | Description                                                                                                                                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _keys_       | A mapping of key generator functions for types that are used to override the default key generation that _Graphcache_ uses to normalize data for given types.                                                                 |
| _resolvers_  | A nested mapping of resolvers, which are used to override the record or entity that _Graphcache_ resolves for a given field for a type.                                                                                       |
| _updates_    | A nested mapping of updater functions for mutation and subscription fields, which may be used to add side-effects that update other parts of the cache when the given subscription or mutation field is written to the cache. |
| _optimistic_ | A mapping of mutation fields to resolvers that may be used to provide _Graphcache_ with an optimistic result for a given mutation field that should be applied to the cached data temporarily.                                |
| _schema_     | A serialized GraphQL schema that is used by _Graphcache_ to resolve partial data, to resolve interfaces and enums, and to provide helpful warnings.                                                                           |

### `keys` option

This is a mapping of typenames to `KeyGenerator` functions.

```ts
interface KeyingConfig {
  [typename: string]: (data: Data) => null | string;
}
```

It may be used to alter how _Graphcache_ generates the key it uses for normalization for individual
types. The key generator function may also always return `null` when a type should always be
embedded.

[Read more about how to set up `keys` in the "Key Generation" section of the "Normalized Caching"
page.](../graphcache/normalized-caching.md#key-generation)

### `resolvers` option

This configuration is a mapping of typenames to field names to `Resolver` functions.
A resolver may be defined to override the entity or record that a given field on a type should
resolve on the cache.

```ts
interface ResolverConfig {
  [typeName: string]: {
    [fieldName: string]: Resolver;
  };
}
```

A `Resolver` receives four arguments when it's called: `parent`, `args`, `cache`, and
`info`.

| Argument | Type     | Description                                                                                                 |
| -------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| parent   | `Data`   | The parent entity that the given field is on.                                                               |
| args     | `object` | The arguments for the given field the updater is executed on.                                               |
| cache    | `Cache`  | The cache using which data can be read or written. [See `Cache`.](#cache)                                   |
| info     | `Info`   | Additional metadata and information about the current operation and the current field. [See `Info`.](#info) |

[Read more about how to set up `resolvers` on the "Computed Queries"
page.](../graphcache/computed-queries.md)

### `updates` option

The `updates` configuration is a mapping of `'Mutation' | 'Subscription'` to field names to
`UpdateResolver` functions. An update resolver may be defined to add side-effects that run when a
given mutation field or subscription field is written to the cache. These side-effects are helpful
to update data in the cache that is implicitly changed on the GraphQL API, that _Graphcache_ can't
know about automatically.

```ts
interface UpdatesConfig {
  Mutation: {
    [fieldName: string]: UpdateResolver;
  };
  Subscription: {
    [fieldName: string]: UpdateResolver;
  };
}
```

An `UpdateResolver` receives four arguments when it's called: `result`, `args`, `cache`, and
`info`.

| Argument                                              | Type     | Description                                                               |
| ----------------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| result                                                | `any`    | Always the entire `data` object from the mutation or subscription.        |
| args                                                  | `object` | The arguments for the given field the updater is executed on.             |
| cache                                                 | `Cache`  | The cache using which data can be read or written. [See `Cache`.](#cache) |
| info                                                  | `Info`   | Additional metadata and information about the current                     |
| operation and the current field. [See `Info`.](#info) |

[Read more about how to set up `updates` on the "Custom Updates"
page.](../graphcache/custom-updates.md)

### `optimistic` option

The `optimistic` configuration is a mapping of Mutation field names to `OptimisticMutationResolver`
functions, which return optimistic mutation results for given fields. These results are used by
_Graphcache_ to optimistically update the cache data, which provides an immediate and temporary
change to its data before a mutation completes.

```ts
interface OptimisticMutationConfig {
  [mutationFieldName: string]: OptimisticMutationResolver;
}
```

A `OptimisticMutationResolver` receives three arguments when it's called: `variables`, `cache`, and
`info`.

| Argument                                              | Type     | Description                                                               |
| ----------------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| variables                                             | `object` | The variables that the given mutation received.                           |
| cache                                                 | `Cache`  | The cache using which data can be read or written. [See `Cache`.](#cache) |
| info                                                  | `Info`   | Additional metadata and information about the current                     |
| operation and the current field. [See `Info`.](#info) |

[Read more about how to set up `optimistic` on the "Custom Updates"
page.](../graphcache/custom-updates.md)

### `schema` option

The `schema` option may be used to pass a `IntrospectionQuery` data to _Graphcache_, in other words
it's used to provide schema information to it. This schema is then used to resolve and return
partial results when querying, which are results that the cache can partially resolve as long as no
required fields are missing.

[Read more about how to use the `schema` option on the "Schema Awareness"
page.](../graphcache/schema-awareness.md)

## Cache

An instance of the `Cache` interface is passed to every resolvers and updater function. It may be
used to read cached data or write cached data, which may be used in combination with the
[`cacheExchange` configuration](#cacheexchange) to alter the default behaviour of _Graphcache_.

### keyOfEntity

TODO

(Also mention `keyOfField` in here, but not as a separate section)

### resolve

TODO

(Also mention `resolveFieldByKey` in here, but not as a separate section)

### inspectFields

TODO

### updateQuery

TODO

### readQuery

TODO

### readFragment

TODO

### writeFragment

TODO

### invalidate

TODO

## Info

This is a metadata object that is passed to every resolver and updater function. It contains basic
information about the current GraphQL document and query, and also some information on the current
field that a given resolver or updater is called on.

| Argument       | Type                                         | Description                                                                                                                                    |
| -------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| parentTypeName | `string`                                     | The field's parent entity's typename                                                                                                           |
| parentKey      | `string`                                     | The field's parent entity's cache key (if any)                                                                                                 |
| parentFieldKey | `string`                                     | The current key's cache key, which is the parent entity's key combined with the current field's key (This is mostly obsolete)                  |
| fieldName      | `string`                                     | The current field's name                                                                                                                       |
| fragments      | `{ [name: string]: FragmentDefinitionNode }` | A dictionary of fragments from the current GraphQL document                                                                                    |
| variables      | `object`                                     | The current GraphQL operation's variables (may be an empty object)                                                                             |
| partial        | `?boolean`                                   | This may be set to `true` at any point in time (by your custom resolver or by _Graphcache_) to indicate that some data is uncached and missing |
| optimistic     | `?boolean`                                   | This is only `true` when an optimistic mutation update is running                                                                              |

> **Note:** Using `info` is regarded as a last resort. Please only use information from it if
> there's no other solution to get to the metadata you need. We don't regard the `Info` API as
> stable and may change it with a simple minor version bump.

## The `/extras` import

TODO

### simplePagination

TODO

### relayPagination

TODO
