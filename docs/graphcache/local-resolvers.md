---
title: Local Resolvers
order: 2
---

# Local Resolvers

Previously, we've learned about local resolvers [on the "Normalized Caching"
page](./normalized-caching.md#manually-resolving-entities). They allow us to change the data that
Graphcache reads as it queries against its local cache, return links that would otherwise not be
cached, or even transform scalar records on the fly.

The `resolvers` option on `cacheExchange` accepts a map of types with a nested map of fields, which
means that we can add local resolvers to any field of any type. For example:

```js
cacheExchange({
  resolvers: {
    Todo: {
      updatedAt: parent => new Date(parent.updatedAt),
    },
  },
});
```

In the above example, what Graphcache does when it encounters the `updatedAt` field on `Todo` types.
Similarly to how Graphcache knows [how to generate
keys](./normalized-caching.md#custom-keys-and-non-keyable-entities) and looks up our custom `keys`
configuration functions per `__typename`, it also uses our `resolvers` configuration on each field
it queries from its locally cached data.

A local resolver function in Graphcache has a similar signature to [GraphQL.js' resolvers on the
server-side](https://www.graphql-tools.com/docs/resolvers/), so their shape should look familiar to
us.

```js
{
  TypeName: {
    fieldName: (parent, args, cache, info) => {
      return null; // new value
    },
  },
}
```

A resolver may be attached to any type's field and accepts four positional arguments:

- `parent`: The object on which the field will be added to, which contains the data as it's being
  queried. It will contain the current field's raw value if it's a scalar, which allows us to
  manipulate scalar values, like `parent.updatedAt` in the previous example.
- `args`: The arguments that the field is being called with, which will be replaced with an empty
  object if the field hasn't been called with any arguments. For example, if the field is queried as
  `name(capitalize: true)` then `args` would be `{ capitalize: true }`.
- `cache`: Unlike in GraphQL.js this will not be the context, but a `cache` instance, which gives us
  access to methods allowing us to interact with the local cache. Its full API can be found [in the
  API docs](../api/graphcache.md#cache).
- `info`: This argument shouldn't be used frequently, but it contains running information about the
  traversal of the query document. It allows us to make resolvers reusable or to retrieve
  information about the entire query. Its full API can be found [in the API
  docs](../api/graphcache.md#info).

The local resolvers may return any value that fits the query document's shape, however we must
ensure that what we return matches the types of our schema. It for instance isn't possible to turn a
record field into a link, i.e. replace a scalar with an entity. Instead, local resolvers are useful
to transform records, like dates in our previous example, or to imitate server-side logic to allow
Graphcache to retrieve more data from its cache without sending a query to our API.

## Transforming Records

As we've explored in the ["Normalized Caching" page's section on
records](./normalized-caching.md#storing-normalized-data), "records" are scalars and any fields in
your query without selection sets. This could be a field with a string value, number, or any other
field that resolves to a [scalar type](https://graphql.org/learn/schema/#scalar-types) rather than
another entity i.e. object type.

At the beginning of this page we've already seen an example of a local resolver that we've attached
to a record field where we've added a resolver to a `Todo.updatedAt` field:

```js
cacheExchange({
  resolvers: {
    Todo: {
      updatedAt: parent => new Date(parent.updatedAt),
    },
  },
});
```

A query that contains this field may look like `{ todo { updatedAt } }`, which clearly shows us that
this field is a scalar since it doesn't have any selection set on the `updatedAt` field. In our
example, we access this field's value and parse it as a `new Date()`.

This shows us that it doesn't matter for scalar fields what kind of value we return. We may parse
strings into more granular JS-native objects or replace values entirely.

We may also run into situations where we'd like to generalise the resolver and not make it dependent
on the exact field it's being attached to. In these cases, the [`info`
object](../api/graphcache.md#info) can be very helpful as it provides us information about the
current query traversal, and the part of the query document the cache is processing. The
`info.fieldName` property is one of these properties and lets us know the field that the resolver is
operating on. Hence, we can create a reusable resolver like so:

```js
const transformToDate = (parent, _args, _cache, info) =>
  new Date(parent[info.fieldName]);

cacheExchange({
  resolvers: {
    Todo: { updatedAt: transformToDate },
  },
});
```

The resolver is now much more reusable, which is particularly handy if we're creating resolvers that
we'd like to apply to multiple fields. The [`info` object has several more
fields](../api/graphcache.md#info) that are all similarly useful to abstract our resolvers.

We also haven't seen yet how to handle a field's arguments.
If we have a field that accepts arguments we can use those as well as they're passed to us with the
second argument of a resolver:

```js
cacheExchange({
  resolvers: {
    Todo: {
      text: (parent, args) => {
        return args.capitalize && parent.text
          ? parent.text.toUpperCase()
          : parent.text;
      },
    },
  },
});
```

This is actually unlikely to be of use with records and scalar values as our API will have to be
able to use these arguments just as well. In other words, while you may be able to pass any
arguments to a field in your query, your GraphQL API's schema must accept these arguments in the
first place. However, this is still useful if we're trying to imitate what the API is doing, which
will become more relevant in the following examples and sections.

## Resolving Entities

We've already briefly seen that resolvers can be used to replace a link in Graphcache's local data
on the ["Normalized Caching" page](./normalized-caching.md#manually-resolving-entities).

Given that Graphcache [stores entities in a normalized data
structure](./normalized-caching.md#storing-normalized-data) there may be multiple fields on a given
schema that can be used to get to the same entity. For instance, the schema may allow for the same
entity to be looked up by an ID while this entity may also appear somewhere else in a list or on an
entirely different field.

When links (or relations) like these are cached by Graphcache it is able to look up the entities
automatically, e.g. if we've sent a `{ todo(id: 1) { id } }` query to our API once then Graphcache
will have seen that this field leads to the entity it returns and can query it automatically from
its cache.

However, if we have a list like `{ todos { id } }` we may have seen and cached a specific entity,
but as we browse the app and query for `{ todo(id: 1) { id } }`, Graphcache isn't able to
automatically find this entity even if it has cached it already and will send a request to our API.

In many cases we can create a local resolvers to instead tell the cache where to look for a specific
entity by returning partial information for it. Any resolver on a relational field, meaning any
field that links to an object type (or a list of object types) in the schema, may return a partial
entity that tells the cache how to resolve it. Hence, we're able to implement a resolver for the
previously shown `todo(id: $id)` field as such:

```js
cacheExchange({
  resolvers: {
    Query: {
      todo: (_, args) => ({ __typename: 'Todo', id: args.id }),
    },
  },
});
```

The `__typename` field is required. Graphcache will [use its keying
logic](./normalized-caching.md#custom-keys-and-non-keyable-entities), and your custom `keys`
configuration to generate a key for this entity and will then be able to look this entity up in its
local cache. As with regular queries, the resolver is known to return a link since the `todo(id:
$id) { id }` will be used with a selection set, querying fields on the entity.

### Resolving by keys

Resolvers can also directly return keys. We've previously learned [on the "Normalized Caching"
page](./normalized-caching.md#custom-keys-and-non-keyable-entities) that the key for our example above
would look something like `"Todo:1"` for `todo(id: 1)`. While it isn't advisable to create keys
manually in your resolvers, if you returned a key directly this would still work.

Essentially, returning `{ __typename, id }` may sometimes be the same as returning the key manually.
The `cache` that we receive as an argument on resolvers has a method for this logic, [the
`cache.keyOfEntity` method](../api/graphcache.md#keyofentity).

While it doesn't make much sense in this case, our example can be rewritten as:

```js
cacheExchange({
  resolvers: {
    Query: {
      todo: (_, args, cache) =>
        cache.keyOfEntity({ __typename: 'Todo', id: args.id }),
    },
  },
});
```

And while it's not advisable to create keys ourselves, the resolvers' `cache` and `info` arguments
give us ample opportunities to use and pass around keys.

One example is the `info.parentKey` property. This property [on the `info`
object](../api/graphcache.md#info) will always be set to the key of the entity that the resolver is
currently run on. For instance, for the above resolver it may be `"Query"`, for for a resolver on
`Todo.updatedAt` it may be `"Todo:1"`.

## Resolving other fields

In the above two examples we've seen how a resolver can replace Graphcache's logic, which usually
reads links and records only from its locally cached data. We've seen how a field on a record can
use `parent[fieldName]` to access its cached record value and transform it and how a resolver for a
link can return a partial entity [or a key](#resolving-by-keys).

However sometimes we'll need to resolve data from other fields in our resolvers.

For records, if the other field is on the same `parent` entity, it may seem logical to access it on
`parent[otherFieldName]` as well, however the `parent` object will only be sparsely populated with
fields that the cache has already queried prior to reaching the resolver.

In the previous example, where we've created a resolver for `Todo.updatedAt` and accessed
`parent.updatedAt` to transform its value the `parent.updatedAt` field is essentially a shortcut
that allows us to get to the record quickly.

Instead we can use [the `cache.resolve` method](../api/graphcache.md#resolve). This method
allows us to access Graphcache's cached data directly. It is used to resolve records or links on any
given entity and accepts three arguments:

- `entity`: This is the entity on which we'd like to access a field. We may either pass a keyable,
  partial entity, e.g. `{ __typename: 'Todo', id: 1 }` or a key. It takes the same inputs as [the
  `cache.keyOfEntity` method](../api/graphcache.md#keyofentity), which we've seen earlier in the
  ["Resolving by keys" section](#resolving-by-keys). It also accepts `null` which causes it to
  return `null`, which is useful for chaining multiple `resolve` calls for deeply accessing a field.
- `fieldName`: This is the field's name we'd like to access. If we're looking for the record on
  `Todo.updatedAt` we would pass `"updatedAt"` and would receive the record value for this field. If
  we pass a field that is a _link_ to another entity then we'd pass that field's name (e.g.
  `"author"` for `Todo.author`) and `cache.resolve` will return a key instead of a record value.
- `fieldArgs`: Optionally, as the third argument we may pass the field's arguments, e.g. `{ id: 1 }`
  if we're trying to access `todo(id: 1)` for instance.

This means that we can rewrite our original `Todo.updatedAt` example as follows, if we'd like to
avoid using the `parent[fieldName]` shortcut:

```js
cacheExchange({
  resolvers: {
    Todo: {
      updatedAt: (parent, _args, cache) =>
        new Date(cache.resolve(parent, "updatedAt")),
    },
  },
});
```

When we call `cache.resolve(parent, "updatedAt")`, the cache will look up the `"updatedAt"` field on
the `parent` entity, i.e. on the current `Todo` entity.
We've also previously learned that `parent` may not contain all fields that the entity may have and
may hence be missing its keyable fields, like `id`, so why does this then work?
It works because `cache.resolve(parent)` is a shortcut for `cache.resolve(info.parentKey)`.

Like the `info.fieldName` property `info.parentKey` gives us information about the current state of
Graphcache's query operation. In this case, `info.parentKey` tells us what the parent's key is.
However, since `cache.resolve(parent)` is much more intuitive we can write that instead since this
is a supported shortcut.

From this follows that we may also use `cache.resolve` to access other fields. Let's suppose we'd
want `updatedAt` to default to the entity's `createdAt` field when it's actually `null`. In such a
case we could write a resolver like so:

```js
cacheExchange({
  resolvers: {
    Todo: {
      updatedAt: (parent, _args, cache) =>
        parent.updatedAt || cache.resolve(parent, "createdAt")
    },
  },
});
```

As we can see, we're effortlessly able to access other records from the cache, provided these fields
are actually cached. If they aren't `cache.resolve` will return `null` instead.

Beyond records, we're also able to resolve links and hence jump to records from another entity.
Let's suppose we have an `author { id, createdAt }` field on the `Todo` and would like
`Todo.createdAt` to simply copy the author's `createdAt` field. We can chain `cache.resolve` calls
to get to this value:

```js
cacheExchange({
  resolvers: {
    Todo: {
      createdAt: (parent, _args, cache) =>
        cache.resolve(
          cache.resolve(parent, "author"), /* "Author:1" */
          "createdAt"
        )
    },
  },
});
```

The return value of `cache.resolve` changes depending on what data the cache has stored. While it
may return records for fields without selection sets, in other cases it may give you the key of
other entities ("links") instead. It can even give you arrays of keys or records when the field's
value contains a list.

It's a pretty flexible method that allows us to access arbitrary values from our cache, however, we
have to be careful about what value will be resolved by it, since the cache can't know itself what
type of value it may return.

The last trick this method allows you to apply is to access arbitrary fields on the root `Query`
type. If we call `cache.resolve("Query", ...)` then we're also able to access arbitrary fields
starting from the root `Query` of the cached data. (If you're using [Schema
Awareness](./schema-awareness.md) the name `"Query"` may vary for you depending on your schema.)
We're not constrained to accessing fields on the `parent` of a resolver but can also attempt to
break out and access fields on any other entity we know of.

## Resolving Partial Data

Local resolvers also allow for more advanced use-cases when it comes to links and object types.
Previously we've seen how a resolver is able to link up a given field to an entity, which causes
this field to resolve an entity directly instead of it being checked against any cached links:

```js
cacheExchange({
  resolvers: {
    Query: {
      todo: (_, args) => ({ __typename: 'Todo', id: args.id }),
    },
  },
});
```

In this example, while `__typename` and `id` are required to make this entity keyable, we're also
able to add on more fields to this object to override values later on in our selection.

For instance, we can write a resolver that links `Query.todo` directly to our `Todo` entity but also
only updates the `createdAt` field directly in the same resolver, if it is indeed accessed via the
`Query.todo` field:

```js
cacheExchange({
  resolvers: {
    Query: {
      todo: (_, args) => ({
        __typename: 'Todo',
        id: args.id,
        createdAt: new Date().toString(),
      }),
    },
  },
});
```

Here we've replaced the `createdAt` value of the `Todo` when it's accessed via this manual resolver.
If it was accessed someplace else, for instance via a `Query.todos` listing field, this override
wouldn't apply.

We can even apply overrides to nested fields, which helps us to create complex resolvers for other
use cases like pagination.

[Read more on the topic of "Pagination" in the section below.](#pagination)

## Computed Queries

We've now seen how the `cache` has several powerful methods, like [the `cache.resolve`
method](../api/graphcache.md#resolve), which allow us to access any data in the cache while writing
resolvers for individual fields.

Additionally the cache has more methods that allow us to access more data at a time, like
`cache.readQuery` and `cache.readFragment`.

### Reading a query

At any point, the `cache` allows us to read entirely separate queries in our resolvers, which starts
a separate virtual operation in our resolvers. When we call `cache.readQuery` with a query and
variables we can execute an entirely new GraphQL query against our cached data:

```js
import { gql } from '@urql/core';
import { cacheExchange } from '@urql/exchange-graphcache';

const cache = cacheExchange({
  updates: {
    Mutation: {
      addTodo: (result, args, cache) => {
        const data = cache.readQuery({ query: Todos, variables: { from: 0, limit: 10 } });
      }
    }
  }
})
```

This way we'll get the stored data for the `TodosQuery` for the given `variables`.

[Read more about `cache.readQuery` in the Graphcache API docs.](../api/graphcache.md#readquery)

### Reading a fragment

The store also allows us to read a fragment for any given entity. The `cache.readFragment` method
accepts a `fragment` and an `id`. This looks like the following.

```js
import { gql } from '@urql/core';
import { cacheExchange } from '@urql/exchange-graphcache';

const cache = cacheExchange({
  resolvers: {
    Query: {
      Todo: (parent, args, cache) => {
        return cache.readFragment(
          gql`
            fragment _ on Todo {
              id
              text
            }
          `,
          { id: 1 }
        );
      }
    }
  }
})
```

> **Note:** In the above example, we've used
> [the `gql` tag function](../api/core.md#gql) because `readFragment` only accepts
> GraphQL `DocumentNode`s as inputs, and not strings.

This way we'll read the entire fragment that we've passed for the `Todo` for the given key, in this
case `{ id: 1 }`.

[Read more about `cache.readFragment` in the Graphcache API docs.](../api/graphcache.md#readfragment)

### Cache methods outside of `resolvers`

The cache read methods are not possible outside of GraphQL operations. This means these methods will
be limited to the different `Graphcache` configuration methods.

## Pagination

`Graphcache` offers some preset `resolvers` to help us out with endless scrolling pagination, also
known as "infinite pagination". It comes with two more advanced but generalised resolvers that can
be applied to two specific pagination use-cases.

They're not meant to implement infinite pagination for _any app_, instead they're useful when we'd
like to add infinite pagination to an app quickly to try it out or if we're unable to replace it
with separate components per page in environments like React Native, where a `FlatList` would
require a flat, infinite list of items.

### Simple Pagination

Given we have a schema that uses some form of `offset` and `limit` based pagination, we can use the
`simplePagination` exported from `@urql/exchange-graphcache/extras` to achieve an endless scroller.

This helper will concatenate all queries performed to one long data structure.

```js
import { cacheExchange } from '@urql/exchange-graphcache';
import { simplePagination } from '@urql/exchange-graphcache/extras';

const cache = cacheExchange({
  resolvers: {
    Query: {
      todos: simplePagination(),
    },
  },
});
```

This form of pagination accepts an object as an argument, we can specify two
options in here `limitArgument` and `offsetArgument` these will default to `limit`
and `skip` respectively. This way we can use the keywords that are in our queries.

We may also add the `mergeMode` option, which defaults to `'after'` and can otherwise
be set to `'before'`. This will handle in which order pages are merged when paginating.
The default `after` mode assumes that pages that come in last should be merged
_after_ the first pages. The `'before'` mode assumes that pages that come in last
should be merged _before_ the first pages, which can be helpful in a reverse
endless scroller (E.g. Chat App).

Example series of requests:

```
// An example where mergeMode: after works better
skip: 0, limit: 3 => 1, 2, 3
skip: 3, limit: 3 => 4, 5, 6

mergeMode: after => 1, 2, 3, 4, 5, 6 ✔️
mergeMode: before => 4, 5, 6, 1, 2, 3

// An example where mergeMode: before works better
skip: 0, limit: 3 => 4, 5, 6
skip: 3, limit: 3 => 1, 2, 3

mergeMode: after => 4, 5, 6, 1, 2, 3
mergeMode: before => 1, 2, 3, 4, 5, 6 ✔️
```

### Relay Pagination

Given we have a [relay-compatible schema](https://facebook.github.io/relay/graphql/connections.htm)
on our backend, we can offer the possibility of endless data resolving.
This means that when we fetch the next page in our data
received in `useQuery` we'll see the previous pages as well. This is useful for
endless scrolling.

We can achieve this by importing `relayPagination` from `@urql/exchange-graphcache/extras`.

```js
import { cacheExchange } from '@urql/exchange-graphcache';
import { relayPagination } from '@urql/exchange-graphcache/extras';

const cache = cacheExchange({
  resolvers: {
    Query: {
      todos: relayPagination(),
    },
  },
});
```

`relayPagination` accepts an object of options, for now we are offering one
option and that is the `mergeMode`. This defaults to `inwards` and can otherwise
be set to `outwards`. This will handle how pages are merged when we paginate
forwards and backwards at the same time. outwards pagination assumes that pages
that come in last should be merged before the first pages, so that the list
grows outwards in both directions. The default inwards pagination assumes that
pagination last pages is part of the same list and come after first pages.
Hence it merges pages so that they converge in the middle.

Example series of requests:

```
first: 1 => node 1, endCursor: a
first: 1, after: a => node 2, endCursor: b
...
last: 1 => node 99, startCursor: c
last: 1, before: c => node 89, startCursor: d
```

With inwards merging the nodes will be in this order: `[1, 2, ..., 89, 99]`
And with outwards merging: `[..., 89, 99, 1, 2, ...]`

The helper happily supports schema that return nodes rather than
individually-cursored edges. For each paginated type, we must either
always request nodes, or always request edges -- otherwise the lists
cannot be stiched together.

### Reading on

[On the next page we'll learn about "Cache Updates".](./cache-updates.md)
