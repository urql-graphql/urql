---
title: Local Resolvers
order: 2
---

# Local Resolvers

Previously we've learned about local resolvers [on the "Normalized Caching"
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
- `cache`: Unlike in GraphQL.js this will not be the context but a `cache` instance, which gives us
  access to methods allowing us to interact with the local cache. Its full API can be found [in the
  API docs](../api/graphcache.md#cache).
- `info`: This argument shouldn't be used frequently but it contains running information about the
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

Furthermore, if we have a field that accepts arguments we can use those as well:

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

## Cache parameter

This is the main point of communication with the cache, it will give us access to
all cached data.

### resolve

The `cache.resolve` method is used to get links and property values from the cache.
Our cache methods have three arguments:

- `entity` – This can either be an object containing a `__typename` and an `id` or
  `_id` field _or_ a string key leading to a cached entity.
- `field` – The field we want data for. This can be a relation or a single property.
- `arguments` – The arguments to include on the field.

To get a better grasp let's look at a few examples,
consider the following data structure:

```js
todos: [
  {
    id: '1',
    text: 'Install urql',
    complete: true,
    author: { id: '2', name: 'Bar' },
  },
  {
    id: '2',
    text: 'Learn urql',
    complete: true,
    author: { id: '1', name: 'Foo' },
  },
];
```

Lets get the `author` for a todo.

```js
const parent = {
  id: '1',
  text: 'Install urql',
  complete: true,
  author: undefined,
  __typename: 'Todo',
};

console.log(cache.resolve(parent, 'author')); // 'Author:2'
```

Now we have a stringed key that identifies our author. We
can use this to derive the name of our author.

```js
const name = cache.resolve('Author:2', 'name');
console.log(name); // 'Bar'
```

This can help solve practical use cases like date formatting,
where we would query the date and then convert it in our resolver.

We can also link entities that come from a list, imagine the scenario where
we have queried `todos` but now want the detailView of a single `todo`.

```js
const cache = cacheExchange({
  resolvers: {
    Query: { todo: (parent, args) => ({ __typename: 'Todo', id: args.id }) },
  },
});
```

Returning a `__typename` and `key` (`id`/`_id`/custom key) is sufficient to make the
cache resolve this to the full entity.

Note that resolving from a list to details can lead to partial data, this will result in
a network-request to get the full data when fields are missing.
When graphcache isn't [aware of our schema](./schema-awareness.md) it won't show partial data.

### Reading a query

Another method the cache allows is to let us read a full query, this method
accepts an object of `query` and optionally `variables`.

```js
cache.readQuery({ query: Todos, variables: { from: 0, limit: 10 } })`
```

This way we'll get the stored data for the `TodosQuery` for the given `variables`.

### Reading a fragment

The store allows the user to also read a fragment for a certain entity, this function
accepts a `fragment` and an `id`. This looks like the following.

```js
import { gql } from '@urql/core';

const data = cache.readFragment(
  gql`
    fragment _ on Todo {
      id
      text
    }
  `,
  '1'
);
```

> **Note:** In the above example, we've used
> [the `gql` tag function](../api/core.md#gql) because `readFragment` only accepts
> GraphQL `DocumentNode`s as inputs, and not strings.

This way we'll get the Todo with id 1 and the relevant data we are asking for in the
fragment.

## Pagination

`Graphcache` offers some preset `resolvers` to help us out with endless scrolling pagination.

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
first: 1, after: 1 => node 2, endCursor: b
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

[On the next page we'll learn about "Custom updates".](./custom-updates.md)
