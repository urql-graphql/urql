---
title: '@urql/exchange-graphcache'
order: 4
---

# @urql/exchange-graphcache

> **Note:** These API docs are deprecated as we now keep TSDocs in all published packages.
> You can view TSDocs while using these packages in your editor, as long as it supports the
> TypeScript Language Server.
> We're planning to replace these API docs with a separate web app soon.

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
| `keys`       | A mapping of key generator functions for types that are used to override the default key generation that _Graphcache_ uses to normalize data for given types.                                                                 |
| `resolvers`  | A nested mapping of resolvers, which are used to override the record or entity that _Graphcache_ resolves for a given field for a type.                                                                                       |
| `directives` | A mapping of directives, which are functions accepting directive arguments and returning a resolver, which can be referenced by `@localDirective` or `@_localDirective` in queries.                                           |
| `updates`    | A nested mapping of updater functions for mutation and subscription fields, which may be used to add side-effects that update other parts of the cache when the given subscription or mutation field is written to the cache. |
| `optimistic` | A mapping of mutation fields to resolvers that may be used to provide _Graphcache_ with an optimistic result for a given mutation field that should be applied to the cached data temporarily.                                |
| `schema`     | A serialized GraphQL schema that is used by _Graphcache_ to resolve partial data, interfaces, and enums. The schema also used to provide helpful warnings for [schema awareness](../graphcache/schema-awareness.md).          |
| `storage`    | A persisted storage interface that may be provided to preserve cache data for [offline support](../graphcache/offline.md).                                                                                                    |
| `globalIDs`  | A boolean or list of typenames that have globally unique ids, this changes how graphcache internally keys the entities. This can be useful for complex interface relationships.                                               |
| `logger`     | A function that will be invoked for warning/debug/... logs                                                                                                                                                                    |

The `@urql/exchange-graphcache` package also exports the `offlineExchange`; which is identical to
the `cacheExchange` but activates [offline support](../graphcache/offline.md) when the `storage` option is passed.

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
| `parent` | `Data`   | The parent entity that the given field is on.                                                               |
| `args`   | `object` | The arguments for the given field the updater is executed on.                                               |
| `cache`  | `Cache`  | The cache using which data can be read or written. [See `Cache`.](#cache)                                   |
| `info`   | `Info`   | Additional metadata and information about the current operation and the current field. [See `Info`.](#info) |

We can use the arguments it receives to either return new data based on just the arguments and other
cache information, but we may also read information about the parent and return new data for the
current field.

```js
{
  Todo: {
    createdAt(parent, args, cache) {
      // Read `createdAt` on the parent but return a Date instance
      const date = cache.resolve(parent, 'createdAt');
      return new Date(date);
    }
  }
}
```

[Read more about how to set up `resolvers` on the "Computed Queries"
page.](../graphcache/local-resolvers.md)

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

| Argument | Type     | Description                                                                                                 |
| -------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `result` | `any`    | Always the entire `data` object from the mutation or subscription.                                          |
| `args`   | `object` | The arguments for the given field the updater is executed on.                                               |
| `cache`  | `Cache`  | The cache using which data can be read or written. [See `Cache`.](#cache)                                   |
| `info`   | `Info`   | Additional metadata and information about the current operation and the current field. [See `Info`.](#info) |

It's possible to derive more information about the current update using the `info` argument. For
instance this metadata contains the current `fieldName` of the updater which may be used to make an
updater function more reusable, along with `parentKey` and other key fields. It also contains
`variables` and `fragments` which remain the same for the entire write operation, and additionally
it may have the `error` field set to describe whether the current field is `null` because the API
encountered a `GraphQLError`.

[Read more about how to set up `updates` on the "Custom Updates"
page.](../graphcache/cache-updates.md)

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

| Argument | Type     | Description                                                                                                 |
| -------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `args`   | `object` | The arguments that the given mutation field received.                                                       |
| `cache`  | `Cache`  | The cache using which data can be read or written. [See `Cache`.](#cache)                                   |
| `info`   | `Info`   | Additional metadata and information about the current operation and the current field. [See `Info`.](#info) |

[Read more about how to set up `optimistic` on the "Custom Updates"
page.](../graphcache/cache-updates.md)

### `schema` option

The `schema` option may be used to pass a `IntrospectionQuery` data to _Graphcache_, in other words
it's used to provide schema information to it. This schema is then used to resolve and return
partial results when querying, which are results that the cache can partially resolve as long as no
required fields are missing.

[Read more about how to use the `schema` option on the "Schema Awareness"
page.](../graphcache/schema-awareness.md)

### `storage` option

The `storage` option is an interface of methods that are used by the `offlineExchange` to persist
the cache's data to persisted storage on the user's device. it

> **NOTE:** Offline Support is currently experimental! It hasn't been extensively tested yet and
> may not always behave as expected. Please try it out with caution!

| Method            | Type                                          | Description                                                                                                                                                                            |
| ----------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `writeData`       | `(delta: SerializedEntries) => Promise<void>` | This provided method must be able to accept an object of key-value entries that will be persisted to the storage. This method is called as a batch of updated entries becomes ready.   |
| `readData`        | `() => Promise<SerializedEntries>`            | This provided method must be able to return a single combined object of previous key-value entries that have been previously preserved using `writeData`. It's only called on startup. |
| `writeMetadata`   | `(json: SerializedRequest[]) => void`         | This provided method must be able to persist metadata for the cache. For backwards compatibility it should be able to accept any JSON data.                                            |
| `readMetadata`    | `() => Promise<null \| SerializedRequest[]>`  | This provided method must be able to read the persisted metadata that has previously been written using `writeMetadata`. It's only called on startup.                                  |
| `onOnline`        | `(cb: () => void) => void`                    | This method must be able to accept a callback that is called when the user's device comes back online.                                                                                 |
| `onCacheHydrated` | `() => void`                                  | This method will be called when the `cacheExchange` has finished hydrating the data coming from storage.                                                                               |

These options are split into three parts:

- The `writeMetadata` and `readMetadata` methods are used to persist in-progress optimistic
  mutations to a storage so that they may be retried if the app has been closed while some
  optimistic mutations were still in progress.
- The `writeData` and `readData` methods are used to persist any cache data. This is the normalized
  data that _Graphcache_ usually keeps in memory. The `cacheExchange` will frequently call
  `writeData` with a partial object of its cache data, which `readData` must then be able to return
  in a single combined object on startup. We call the partial objects that `writeData` is called
  with "deltas".
- The `onOnline` method is only used to receive a trigger that determines whether the user's device
  has come back online, which is used to retry optimistic mutations that have previously failed due
  to being offline.

The `storage` option may also be used with the `cacheExchange` instead of the `offlineExchange`, but
will then only use `readData` and `writeData` to persist its cache data. This is not full offline
support, but will rather be "persistence support".

[Read more about how to use the `storage` option on the "Offline Support"
page.](../graphcache/offline.md)

## Cache

An instance of the `Cache` interface is passed to every resolvers and updater function. It may be
used to read cached data or write cached data, which may be used in combination with the
[`cacheExchange` configuration](#cacheexchange) to alter the default behaviour of _Graphcache_.

### keyOfEntity

The `cache.keyOfEntity` method may be called with a partial `Data` object and will return the key
for that object, or `null` if it's not keyable.

An object may not be keyable if it's missing the `__typename` or `id` (which falls back to `_id`)
fields. This method does take the [`keys` configuration](#keys-option) into account.

```js
cache.keyOfEntity({ __typename: 'Todo', id: 1 }); // 'Todo:1'
cache.keyOfEntity({ __typename: 'Query' }); // 'Query'
cache.keyOfEntity({ __typename: 'Unknown' }); // null
```

There's an alternative method, `cache.keyOfField` which generates a key for a given field. This is
only rarely needed but similar to `cache.keyOfEntity`. This method accepts a field name and
optionally a field's arguments.

```js
cache.keyOfField('todo'); // 'todo'
cache.keyOfField('todo', { id: 1 }); // 'todo({"id":1})'
```

Internally, these are the keys that records and links are stored on per entity.

### resolve

This method retrieves a value or link for a given field, given a partially keyable `Data` object or
entity, a field name, and optionally the field's arguments. Internally this method accesses the
cache by using `cache.keyOfEntity` and `cache.keyOfField`.

```js
// This may resolve a link:
cache.resolve({ __typename: 'Query' }, 'todo', { id: 1 }); // 'Todo:1'

// This may also resolve records / scalar values:
cache.resolve({ __typename: 'Todo', id: 1 }, 'id'); // 1

// You can also chain multiple calls to `cache.resolve`!
cache.resolve(cache.resolve({ __typename: 'Query' }, 'todo', { id: 1 }), 'id'); // 1
```

As you can see in the last example of this code snippet, the `Data` object can also be replaced by
an entity key, which makes it possible to pass a key from `cache.keyOfEntity` or another call to
`cache.resolve` instead of the partial entity.

> **Note:** Because `cache.resolve` may return either a scalar value or another entity key, it may
> be dangerous to use in some cases. It's a good idea to make sure first whether the field you're
> reading will be a key or a value.

The `cache.resolve` method may also be called with a field key as generated by `cache.keyOfField`.

```js
cache.resolve({ __typename: 'Query' }, cache.keyOfField('todo', { id: 1 })); // 'Todo:1'
```

This specialized case is likely only going to be useful in combination with
[`cache.inspectFields`](#inspectfields). Previously a specialised method existed for this
case specifically and was called `cache.resolveFieldByKey`, which is now deprecated, since
`cache.resolve` may be called with a field key and no extra arguments.

### inspectFields

The `cache.inspectFields` method may be used to interrogate the cache about all available fields on
a specific entity. It accepts a partial entity or an entity key, like [`cache.resolve`](#resolve)'s
first argument.

When calling the method this returns an array of `FieldInfo` objects, one per field (including
differing arguments) that is known to the cache. The `FieldInfo` interface has three properties:
`fieldKey`, `fieldName`, and `arguments`:

| Argument    | Type             | Description                                                                     |
| ----------- | ---------------- | ------------------------------------------------------------------------------- |
| `fieldName` | `string`         | The field's name (without any arguments, just the name)                         |
| `arguments` | `object \| null` | The field's arguments, or `null` if the field doesn't have any arguments        |
| `fieldKey`  | `string`         | The field's cache key, which is similar to what `cache.keyOfField` would return |

This works on any given entity. When calling this method the cache works in reverse on its data
structure, by parsing the entity's individual field keys.
p

```js
cache.inspectFields({ __typename: 'Query' });

/*
  [
    { fieldName: 'todo', arguments: { id: 1 }, fieldKey: 'id({"id":1})' },
    { fieldName: 'todo', arguments: { id: 2 }, fieldKey: 'id({"id":2})' },
    ...
  ]
*/
```

### readFragment

`cache.readFragment` accepts a GraphQL `DocumentNode` as the first argument and a partial entity or
an entity key as the second, like [`cache.resolve`](#resolve)'s first argument.

The method will then attempt to read the entity according to the fragment entirely from the cached
data. If any data is uncached and missing it'll return `null`.

```js
import { gql } from '@urql/core';

cache.readFragment(
  gql`
    fragment _ on Todo {
      id
      text
    }
  `,
  { id: 1 }
); // Data or null
```

Note that the `__typename` may be left out on the partial entity if the fragment isn't on an
interface or union type, since in that case the `__typename` is already present on the fragment
itself.

If any fields on the fragment require variables, you can pass them as the third argument like so:

```js
import { gql } from '@urql/core';

cache.readFragment(
  gql`
    fragment _ on User {
      id
      permissions(byGroupId: $groupId)
    }
  `,
  { id: 1 }, // this identifies the fragment (User) entity
  { groupId: 5 } // any additional field variables
);
```

If you need a specific fragment in a document containing multiple you can leverage
the fourth argument like this:

```js
import { gql } from '@urql/core';

cache.readFragment(
  gql`
    fragment todoFields on Todo {
      id
    }

    fragment userFields on User {
      id
    }
  `,
  { id: 1 }, // this identifies the fragment (User) entity
  undefined,
  'userFields' // if not passed we take the first fragment, in this case todoFields
);
```

[Read more about using `readFragment` on the ["Local Resolvers"
page.](../graphcache/local-resolvers.md#reading-a-fragment)

### readQuery

The `cache.readQuery` method is similar to `cache.readFragment`, but instead of reading a fragment
from cache, it reads an entire query. The only difference between how these two methods are used is
`cache.readQuery`'s input, which is an object instead of two arguments.

The method accepts a `{ query, variables }` object as the first argument, where `query` may either
be a `DocumentNode` or a `string` and variables may optionally be an object.

```js
cache.readQuery({
  query: `
    query ($id: ID!) {
      todo(id: $id) { id, text }
    }
  `,
  variables: {
    id: 1
  }
); // Data or null
```

[Read more about using `readQuery` on the ["Local Resolvers"
page.](../graphcache/local-resolvers.md#reading-a-query)

### link

Corresponding to [`cache.resolve`](#resolve), the `cache.link` method allows
links in the cache to be updated. While the `cache.resolve` method reads both
records and links from the cache, the `cache.link` method will only ever write
links as fragments (See [`cache.writeFragment`](#writefragment) below) are more
suitable for updating scalar data in the cache.

The arguments for `cache.link` are identical to [`cache.resolve`](#resolve) and
the field's arguments are optional. However, the last argument must always be
a link, meaning `null`, an entity key, a keyable entity, or a list of these.

In other words, `cache.link` accepts an entity to write to as its first argument,
with the same arguments as `cache.keyOfEntity`. It then accepts one or two arguments
that are passed to `cache.keyOfField` to get the targeted field key. And lastly,
you may pass a list or a single entity (or an entity key).

```js
// Link Query.todo field to a todo item
cache.link({ __typename: 'Query' }, 'todo', { __typename: 'Todo', id: 1 });

// You may also pass arguments instead:
cache.link({ __typename: 'Query' }, 'todo', { id: 1 }, { __typename: 'Todo', id: 1 });

// Or use entity keys instead of the entities themselves:
cache.link('Query', 'todo', cache.keyOfEntity({ __typename: 'Todo', id: 1 }));
```

The method may [output a
warning](../graphcache/errors.md#12-cant-generate-a-key-for-writefragment-or-link) when any of the
entities were passed as objects but aren't keyable, which is useful when a scalar or a non-keyable
object have been passed to `cache.link` accidentally.

### writeFragment

Corresponding to [`cache.readFragment`](#readfragments), the `cache.writeFragment` method allows
data in the cache to be updated.

The arguments for `cache.writeFragment` are identical to [`cache.readFragment`](#readfragment),
however the second argument, `data`, should not only contain properties that are necessary to derive
an entity key from the given data, but also the fields that will be written:

```js
import { gql } from '@urql/core';

cache.writeFragment(
  gql`
    fragment _ on Todo {
      text
    }
  `,
  { id: 1, text: 'New Todo Text' }
);
```

In the example we can see that the `writeFragment` method returns `undefined`. Furthermore we pass
`id` in our `data` object so that an entity key can be written, but the fragment itself doesn't have
to include these fields.

If you need a specific fragment in a document containing multiple you can leverage
the fourth argument like this:

```js
import { gql } from '@urql/core';

cache.writeFragment(
  gql`
    fragment todoFields on Todo {
      id
      text
    }

    fragment userFields on User {
      id
      name
    }
  `,
  { id: 1, name: 'New Name' }
  undefined,
  'userFields' // if not passed we take the first fragment, in this case todoFields
);
```

[Read more about using `writeFragment` on the ["Custom Updates"
page.](../graphcache/cache-updates.md#cachewritefragment)

### updateQuery

Similarly to [`cache.writeFragment`](#writefragment), there's an analogous method for
[`cache.readQuery`](#readquery) that may be used to update query data.

The `cache.updateQuery` method accepts the same `{ query, variables }` object input as its first
argument, which is the query we'd like to write to the cache. As a second argument the method
accepts an updater function. This function will be called with the query data that is already in the
cache (which may be `null` if the data is uncached) and must return the new data that should be
written to the cache.

```js
const TodoQuery = `
  query ($id: ID!) {
    todo(id: $id) { id, text }
  }
`;

cache.updateQuery({ query: TodoQuery, variables: { id: 1 } }, data => {
  if (!data) return null;
  data.todo.text = 'New Todo Text';
  return data;
});
```

As we can see, our updater may return `null` to cancel updating any data, which we do in case the
query data is uncached.

We can also see that data can simply be mutated and doesn't have to be altered immutably. This is
because all data from the cache is already a deep copy and hence we can do to it whatever we want.

[Read more about using `updateQuery` on the "Custom Updates"
page.](../graphcache/cache-updates.md#cacheupdatequery)

### invalidate

The `cache.invalidate` method can be used to delete (i.e. "evict") an entity from the cache
entirely. This will cause it to disappear from all queries in _Graphcache_.

Its arguments are identical to [`cache.resolve`](#resolve).

Since deleting an entity will lead to some queries containing missing and uncached data, calling
`invalidate` may lead to additional GraphQL requests being sent, unless you're using [_Graphcache_'s
"Schema Awareness" feature](../graphcache/schema-awareness.md), which takes optional fields into
account.

This method accepts a partial entity or an entity key as its first argument, similar to
[`cache.resolve`](#resolve)'s first argument.

```js
cache.invalidate({ __typename: 'Todo', id: 1 }); // Invalidates Todo:1
```

Additionally `cache.invalidate` may be used to delete specific fields only, which can be useful when
for instance a list is supposed to be evicted from cache, where a full invalidation may be
impossible. This is often the case when a field on the root `Query` needs to be deleted.

This method therefore accepts two additional arguments, similar to [`cache.resolve`](#resolve).

```js
// Invalidates `Query.todos` with the `first: 10` argument:
cache.invalidate('Query', 'todos', { first: 10 });
```

## Info

This is a metadata object that is passed to every resolver and updater function. It contains basic
information about the current GraphQL document and query, and also some information on the current
field that a given resolver or updater is called on.

| Argument         | Type                                         | Description                                                                                                                                                                                              |
| ---------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parent`         | `Data`                                       | The field's parent entity's data, as it was written or read up until now, which means it may be incomplete. [Use `cache.resolve`](#resolve) to read from it.                                             |
| `parentTypeName` | `string`                                     | The field's parent entity's typename                                                                                                                                                                     |
| `parentKey`      | `string`                                     | The field's parent entity's cache key (if any)                                                                                                                                                           |
| `parentFieldKey` | `string`                                     | The current key's cache key, which is the parent entity's key combined with the current field's key (This is mostly obsolete)                                                                            |
| `fieldName`      | `string`                                     | The current field's name                                                                                                                                                                                 |
| `fragments`      | `{ [name: string]: FragmentDefinitionNode }` | A dictionary of fragments from the current GraphQL document                                                                                                                                              |
| `variables`      | `object`                                     | The current GraphQL operation's variables (may be an empty object)                                                                                                                                       |
| `error`          | `GraphQLError \| undefined`                  | The current GraphQLError for a given field. This will always be `undefined` for resolvers and optimistic updaters, but may be present for updaters when the API has returned an error for a given field. |
| `partial`        | `?boolean`                                   | This may be set to `true` at any point in time (by your custom resolver or by _Graphcache_) to indicate that some data is uncached and missing                                                           |
| `optimistic`     | `?boolean`                                   | This is only `true` when an optimistic mutation update is running                                                                                                                                        |

> **Note:** Using `info` is regarded as a last resort. Please only use information from it if
> there's no other solution to get to the metadata you need. We don't regard the `Info` API as
> stable and may change it with a simple minor version bump.

## The `/extras` import

The `extras` subpackage is published with _Graphcache_ and contains helpers and utilities that don't
have to be included in every app or aren't needed by all users of _Graphcache_.
All utilities from extras may be imported from `@urql/exchange-graphcache/extras`.

Currently the `extras` subpackage only contains the [pagination resolvers that have been mentioned
on the "Computed Queries" page.](../graphcache/local-resolvers.md#pagination)

### simplePagination

Accepts a single object of optional options and returns a resolver that can be inserted into the
[`cacheExchange`'s](#cacheexchange) [`resolvers` configuration.](#resolvers-option)

| Argument         | Type                  | Description                                                                                                                                                        |
| ---------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `offsetArgument` | `?string`             | The field arguments' property, as passed to the resolver, that contains the current offset, i.e. the number of items to be skipped. Defaults to `'skip'`.          |
| `limitArgument`  | `?string`             | The field arguments' property, as passed to the resolver, that contains the current page size limit, i.e. the number of items on each page. Defaults to `'limit'`. |
| `mergeMode`      | `'after' \| 'before'` | This option defines whether pages are merged before or after preceding ones when paginating. Defaults to `'after'`.                                                |

Once set up, the resulting resolver is able to automatically concatenate all pages of a given field
automatically. Queries to this resolvers will from then on only return the infinite, combined list
of all pages.

[Read more about `simplePagination` on the "Computed Queries"
page.](../graphcache/local-resolvers.md#simple-pagination)

### relayPagination

Accepts a single object of optional options and returns a resolver that can be inserted into the
[`cacheExchange`'s](#cacheexchange) [`resolvers` configuration.](#resolvers-option)

| Argument    | Type                      | Description                                                                                                                                                                                                                                                                      |
| ----------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mergeMode` | `'outwards' \| 'inwards'` | With Relay pagination, pages can be queried forwards and backwards using `after` and `before` cursors. This option defines whether pages that have been queried backwards should be concatenated before (outwards) or after (inwards) all pages that have been queried forwards. |

Once set up, the resulting resolver is able to automatically concatenate all pages of a given field
automatically. Queries to this resolvers will from then on only return the infinite, combined list
of all pages.

[Read more about `relayPagnation` on the "Computed Queries"
page.](../graphcache/local-resolvers.md#relay-pagination)

## The `/default-storage` import

The `default-storage` subpackage is published with _Graphcache_ and contains a default storage
interface that may be used with the [`storage` option.](#storage-option)

It contains the `makeDefaultStorage` export which is a factory function that accepts a few options
and returns a full [storage interface](#storage-option). This storage by default persists to
[IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).

| Argument  | Type     | Description                                                                                                                                       |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `idbName` | `string` | The name of the IndexedDB database that is used and created if needed. By default this is set to `"graphcache-v3"`                                |
| `maxAge`  | `number` | The maximum age of entries that the storage should use in whole days. By default the storage will discard entries that are older than seven days. |
