---
title: Local Resolvers
order: 2
---

# Local Resolvers

When dealing with data we could have special cases where we want to transform
the data between the API and frontend logic. For example:

- alter the format of a date, perhaps from a UNIX timestamp to a `Date` object.
- if we have a list of a certain entity in the cache and then want to query a
  specific entity, chances are this will already be (partially) available in the
  cache's list.

These cases can be solved with the concept of `resolvers`.

## Resolvers

Let's look at how we can introduce these `resolvers` to our Graphcache exchange.
Let's say we have a `Todo` type with an `updatedAt` property which is a UNIX timestamp.

```js
import { cacheExchange } from '@urql/exchange-graphcache';

const cache = cacheExchange({
  resolvers: {
    Todo: {
      updatedAt(parent, args, cache, info) {
        return new Date(parent.updatedAt);
      },
    },
  },
});
```

Now when we query our `todos` every time we encounter an object with `Todo`
as the `__typename` it will convert the `parent.updatedAt` property to a `Date`. This way we
can effectively change how we handle a certain property on an entity.

Let's look at the arguments passed to `resolvers` to get a better sense of
what we can do, there are four arguments (these are in order):

- `parent` – The original entity in the cache. In the example above, this
  would be the full `Todo` object.
- `args` – The arguments used in this field.
- `cache` – This is the normalized cache. The cache provides us with `resolve`, `readQuery` and `readFragment` methods,
  read more about this [below](#resolve).
- `info` – This contains the fragments used in the query and the field arguments in the query.

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
