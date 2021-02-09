---
title: Normalized Caching
order: 1
---

# Normalized Caching

In GraphQL, like its name suggests, we create schemas that express the relational nature of our
data. When we create and query against a `Query` type we walk a graph that starts at the root
`Query` type and walks through relational types. Rather than querying for normalized data, in
GraphQL our queries request a specific shape of denormalized data, a view into our relational data
that can be re-normalized automatically.

As the GraphQL API walks our query documents it may read from a relational database and _entities_
and scalar values are copied into a JSON document that matches our query document. The type
information of our entities isn't lost however. A query document may still ask the GraphQL API about
what entity it's dealing with using the `__typename` field, which dynamically introspects an
entity's type. This means that GraphQL clients can automatically re-normalize data as results come
back from the API by using the `__typename` field and keyable fields like an `id` or `_id` field,
which are already common conventions in GraphQL schemas. In other words, normalized caches can build
up a relational database of tables in-memory for our application.

For our apps normalized caches can enable more sophisticated use-cases, where different API requests
update data in other parts of the app and automatically update data in our cache as we query our
GraphQL API. Normalized caches can essentially keep the UI of our applications up-to-date when
relational data is detected across multiple queries, mutations, or subscriptions.

## Normalizing Relational Data

As previously mentioned, a GraphQL schema creates a tree of types where our application's data
always starts from the `Query` root type and is modified by other data that's incoming from either a
selection on `Mutation` or `Subscription`. All data that we query from the `Query` type will contain
relations between "entities", JSON objects that are hierarchical.

A normalized cache seeks to turn this denormalized JSON blob back into a relational data structure,
which stores all entities by a key that can be looked up directly. Since GraphQL documents give the
API a strict specification on how it traverses a schema, the JSON data that the cache receives from
the API will always match the GraphQL query document that has been used to query this data.
A common misconception is that normalized caches in GraphQL store data by the query document somehow,
however, the only thing a normalized cache cares about is that it can use our GraphQL query documents
to walk the structure of the JSON data it received from the API.

```graphql
{
  __typename
  todo(id: 1) {
    __typename
    id
    title
    author {
      __typename
      id
      name
    }
  }
}
```

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

Above, we see an example of a GraphQL query document and a corresponding JSON result from a GraphQL
API. In GraphQL, we never lose access to the underlying types of the data. Normalized caches can
ask for the `__typename` field in selection sets automatically and will find out which type a JSON
object corresponds to.

Generally, a normalized cache must do one of two things with a query document like the above:

- It must be able to walk the query document and JSON data of the result and cache the data,
  normalizing it in the process and storing it in relational tables.
- It must later be able to walk the query document and recreate this JSON data just by reading data
  from its cache, by reading entries from its in-memory relational tables.

While the normalized cache can't know the exact type of each field, thanks to the GraphQL query
language it can make a couple of assumptions. The normalized cache can walk the query document. Each
field that has no selection set (like `title` in the above example) must be a "record", a field that
may only be set to a scalar. Each field that does have a selection set must be another "entity" or a
list of "entities". The latter fields with selection sets are our relations between entities, like a
foreign key in relational databases.
Furthermore, the normalized cache can then read the `__typename` field on related entities. This is
called _Type Name Introspection_ and is how it finds out about the types of each entity.
From the above document we can assume the following relations:

- `Query.todo(id: 1)` → `Todo`
- `Todo.author` → `Author`

However, this isn't quite enough yet to store the relations from GraphQL results. The normalized
cache must also generate primary keys for each entity so that it can store them in table-like data
structures. This is for instance why [Relay
enforces](https://relay.dev/docs/en/graphql-server-specification.html#object-identification) that
each entity must have an `id` field. This allows it to assume that there's an obvious primary key
for each entity it may query. Instead, `urql`'s Graphcache and Apollo assume that there _may_ be an
`id` or `_id` field in a given selection set. If Graphcache can't find these two fields it'll issue
a warning, however a custom `keys` configuration may be used to generate custom keys for a given
type. With this logic the normalized cache will actually create the following "links" between its
relational data:

- `"Query"`, `.todo(id: 1)` → `"Todo:1"`
- `"Todo:1"`, `.author` → `"Author:1"`

As we can see, the `Query` root type itself has a constant key of `"Query"`. All relational data
originates here, since the GraphQL schema is a graph and, like a tree, all selections on a GraphQL
query document originate from it.
Internally, the normalized cache now stores field values on entities by their primary keys. The
above can also be said or written as:

- The `Query` entity's `todo` field with `{"id": 1}` arguments points to the `Todo:1` entity.
- The `Todo:1` entity's `author` field points to the `Author:1` entity.

In Graphcache, these "links" are stored in a nested structure per-entity. "Records" are kept
separate from this relational data.

![Normalization is based on types, keys, and relations. This information can all be inferred from
the query document.](../assets/query-document-info.png)

## Storing Normalized Data

At its core, normalizing data means that we take individual fields and store them in a table. In our
case we store all values of fields in a dictionary of their primary key, generated from an ID or
other key and type name, and the field’s name and arguments, if it has any.

| Primary Key            | Field                                           | Value                    |
| ---------------------- | ----------------------------------------------- | ------------------------ |
| Type name and ID (Key) | Field name (not alias) and optionally arguments | Scalar value or relation |

To reiterate we have three pieces of information that are stored in tables:

- The entity's key can be derived from its type name via the `__typename` field and a keyable field.
  By default _Graphcache_ will check the `id` and `_id` fields, however this is configurable.
- The field's name (like `todo`) and optional arguments. If the field has any arguments then we can
  normalize it by JSON stringifying the arguments, making sure that the JSON key is stable by
  sorting its keys.
- Lastly, we may store relations as either `null`, a primary key that refers to another entity, or a
  list of such. For storing "records" we can store the scalars in a separate table.

In _Graphcache_ the data structure for these tables looks a little like the following, where each
entity has a record from fields to other entity keys:

```js
{
  links: Map {
    'Query': Record {
      'todo({"id":1})': 'Todo:1'
    },
    'Todo:1': Record {
      'author': 'Author:1'
    },
    'Author:1': Record { },
  }
}
```

We can see how the normalized cache is now able to traverse a GraphQL query by starting on the
`Query` entity and retrieve relations for other fields.
To retrieve "records" which are all fields with scalar values and no selection sets, _Graphcache_
keeps a second table around with an identical structure. This table only contains scalar values,
which keeps our non-relational data away from our "links":

```js
{
  records: Map {
    'Query': Record {
      '__typename': 'Query'
    },
    'Todo:1': Record {
      '__typename': 'Todo',
      'id': 1,
      'title': 'implement graphcache'
    },
    'Author:1': Record {
      '__typename': 'Author',
      'id': 1,
      'name': 'urql-team'
    },
  }
}
```

This is very similar to how we'd go about creating a state management store manually, except that
_Graphcache_ can use the GraphQL document to perform this normalization automatically.

What we gain from this normalization is that we have a data structure that we can both read from and
write to, to reproduce the API results for GraphQL query documents. Any mutation or subscription can
also be written to this data structure. Once _Graphcache_ finds a keyable entity in their results
it's written to its relational table which may update other queries in our application.
Similarly queries may share data between one another which means that they effectively share
entities using this approach and can update one another.
In other words, once we have a primary key like `"Todo:1"` we may find this primary key again in
other entities in other GraphQL results.

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
