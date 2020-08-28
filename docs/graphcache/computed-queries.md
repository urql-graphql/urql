---
title: Computed Queries
order: 2
---

# Computed Queries

When dealing with data we could have special cases where we want to transform
the data between the API and frontend logic, for example:

- alter the format of a date, perhaps from a UNIX timestamp to a `Date` object.
- if we have a list of a certain entity in the cache and next we want to query a
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
- `field` – The field you want data for. This can be a relation or a single property.
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
where you would query the date and then convert it in your resolver.

You can also link entities that come from a list, imagine the scenario where
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
When graphcache isn't [aware of your schema](./schema-awareness.md) it won't show partial data.

### Reading a query

Another method the cache allows is to let you read a full query, this method
accepts an object of `query` and optionally `variables`.

```js
cache.readQuery({ query: Todos, variables: { from: 0, limit: 10 } })`
```

This way we'll get the stored data for the `TodosQuery` for the given `variables`.

### Reading a fragment

The store allows the user to also read a fragment for a certain entity, this function
accepts a `fragment` and an `id`. This looks like the following.

```js
import gql from 'graphql-tag';

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
> [graphql-tag](https://github.com/apollographql/graphql-tag) because `writeFragment` only accepts
> GraphQL `DocumentNode`s as inputs, and not strings.

This way we'll get the Todo with id 1 and the relevant data we are asking for in the
fragment.

## Pagination

`Graphcache` offers some preset `resolvers` to help us out with endless scrolling pagination.

### Simple Pagination

Given you have a schema that uses some form of `offset` and `limit` based pagination you can use the
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

This form of pagination accepts an object as an argument, you can specify two
options in here `limitArgument` and `offsetArgument` these will default to `limit`
and `skip` respectively. This way you can use the keywords that you are using in
your queries.

### Relay Pagination

Given you have a [relay-compatible schema](https://facebook.github.io/relay/graphql/connections.htm)
on your backend we offer the possibility of endless data resolving.
This means that when you fetch the next page in your data
received in `useQuery` you'll see the previous pages as well. This is useful for
endless scrolling.

You can achieve this by importing `relayPagination` from `@urql/exchange-graphcache/extras`.

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
be set to `outwards`. This will handle how pages are merged when you paginate
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

The helper happily supports schemata that return nodes rather than
individually-cursored edges. For each paginated type, you must either
always request nodes, or always request edges -- otherwise the lists
cannot be stiched together.

### Reading on

[On the next page we'll learn about "Custom updates".](./custom-updates.md)
