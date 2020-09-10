---
title: Normalized Caching
order: 1
---

# Normalized Caching

With _Graphcache_ all data is stored in a normalized data structure. It automatically uses
`__typename` information and `id` fields on entities to create a normalized table of data. Since
GraphQL deals with connected data in a tree structure, each entity may link to other entities or
even lists of entities, which we call "links". The scalar fields on entities like numbers, strings,
etc is what we call "records."

Instead of storing query results whole documents, like `urql` does with [its default "Document
Caching"](../basics/document-caching.md), _Graphcache_ flattens all data it receives automatically.
If we looked at doing this manually on the following piece of data, we'd separate each object into a
list of key-value entries per entity.

```json
{
  "__typename": "Query",
  "todo": {
    "__typename": "Todo",
    "id": 1,
    "title": "implement graphcache",
    "author": {
      "__typename": "Author",
      "id": 1,
      "name": "urql-team"
    }
  }
}
```

The above would look like the following once we normalized the data:

```json
{
  "Query": {
    "todo": "Todo:1" // link
  },
  "Todo:1": {
    "__typename": "Todo",
    "id": "1", // record
    "title": "implement graphcache", // record
    "author": "Author:1" // link
  },
  "Author:1": {
    "__typename": "Author",
    "id": "1", // record
    "name": "urql-team" // record
  }
}
```

This is very similar to how we'd go about creating a state management store manually, except that
_Graphcache_ can use the GraphQL document and the `__typename` field to perform this normalization
automatically.

The interesting part of normalization starts when we read from the cache instead of writing to it.
Multiple results may refer to the same piece of data — a mutation for instance may update `"Todo:1"`
later on in the app. This would automatically cause _Graphcache_ to update any related queries in
the entire app, because all references to each each entity are shared.

## Terminology

A few terms that will be used throughout the _Graphcache_ documentation that are important to understand in order to get a full understanding.

- **Entity**, this is an object for which the cache can generate a key, like `Todo:1`.
- **Record**, this is a property that relate to an entity, in the above case this would be `title`, ...
  internally these will be represented as `Todo:1.title`.
- **Link**, This is the connection between entities or the base `Query` field, this will link an entity key (ex: `Query`/`Todo:1`) to a single or an array
  of keys

## Key Generation

As we saw in the previous example, by default _Graphcache_ will attempt to generate a key by
combining the `__typename` of a piece of data with the `id` or `_id` fields, if they're present. For
instance, `{ __typename: 'Author', id: 1 }` becomes `"Author:1"`.

_Graphcache_ will log a warning when these fields weren't requested as part of a query's selection
set or aren't present in the data. This can be useful if we forget to include them in our queries.
In general, _Graphcache_ will always output warnings in development when it assumes that something
went wrong.

However, in your schema you may have types that don't have an `id` or `_id` field, say maybe some
types have a `key` field instead. In such cases the custom `keys` configuration comes into play

Let's look at an example. Say we have a set of todos each with a `__typename`
of `Todo`, but instead of identifying on `id` or `_id` we want to identify
each record by its `name`:

```js
import { cacheExchange } from '@urql/exchange-graphcache';

const cache = cacheExchange({
  keys: {
    Todo: data => data.name,
  },
});
```

This will cause our cache to generate a key from `__typename` and `name` instead if an entity's type
is `Todo`.

Similarly some pieces of data shouldn't be normalized at all. If _Graphcache_ can't find the `id` or
`_id` fields it will log a warning and _embed the data_ instead. Embedding the data means that it
won't be normalized because the generated key is `null` and will instead only be referenced by the
parent entity.

You can force this behaviour and silence the warning by making a `keys` function that returns `null`
immediately. This can be useful for types that aren't globally unique, like a `GeoPoint`:

```js
const myGraphCache = cacheExchange({
  keys: {
    GeoPoint: () => null,
  },
});
```

### Reading on

[On the next page we'll learn about "Computed queries".](./computed-queries.md)
