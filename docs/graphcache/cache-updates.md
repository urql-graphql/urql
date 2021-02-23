---
title: Cache Updates
order: 3
---

# Cache Updates

As we've learned [on the page on "Normalized
Caching"](../normalized-caching.md#normalizing-relational-data), when Graphcache receives an API
result it will traverse and store all its data to its cache in a normalised structure. Each entity
that is found in a result will be stored under the entity's key.

A query's result is represented as a graph, which can also be understood as a tree structure,
starting from the root `Query` entity which then connects to other entities via links, which are
relations stored as keys, where each entity has records that store scalar values, which are the
tree's leafs. On the previous page, on ["Local Resolvers"](./local-resolvers.md), we've seen how
resolvers can be attached to fields to manually resolve other entities (or transform record fields).
Local Resolvers passively _compute_ results and change how Graphcache traverses and sees its locally
cached data, however, for **mutations** and **subscriptions** we cannot passively compute data.

When Graphcache receives a mutation or subscription result it still traverses it using the query
document as we've learned when reading about how Graphcache stores normalized data,
[quote](./normalized-caching.md/#storing-normalized-data):

> Any mutation or subscription can also be written to this data structure. Once Graphcache finds a
> keyable entity in their results it's written to its relational table which may update other queries
> in our application.

This means that mutations and subscriptions still write and update entities in the cache. These
updates are then reflected on all queries that our app currently uses. However, there are
limitations to this. While resolvers can be used to passively change data for queries, for mutations
and subscriptions we sometimes have to write **updaters** to update links and relations.
This is often necessary when a given mutation or subscription deliver a result that is more granular
than the cache needs to update all affected entities.

Previously, we've learned about cache updates [on the "Normalized Caching"
page](normalized-caching/#manual-cache-updates).

The `updates` option on `cacheExchange` accepts a map for `Mutation` or `Subscription` keys on which
we can add "updater functions" to react to mutation or subscription results. These `updates`
functions look similar to ["Local Resolvers"](./local-resolvers.md) that we've seen in the last
section and similar to [GraphQL.js' resolvers on the
server-side](https://www.graphql-tools.com/docs/resolvers/).

```js
cacheExchange({
  updates: {
    Mutation: {
      mutationField: (result, args, cache, info) => {
        // ...
      },
    },
    Subscription: {
      subscriptionField: (result, args, cache, info) => {
        // ...
      },
    },
  },
})
```

An "updater" may be attached to a `Mutation` or `Subscription` field and accepts four positional
arguments, which are the same as [the resolvers' arguments](./local-resolvers.md):

- `result`: The full API result that's currently being written to the cache. Typically we'd want to
  avoid coupling by only looking at the current field that the updater is attached to, but it's
  worth noting that we can access any part of the result.
- `args`: The arguments that the field has been called with, which will be replaced with an empty
  object if the field hasn't been called with any arguments.
- `cache`: The `cache` instance, which gives us access to methods allowing us to interact with the
- local cache. Its full API can be found [in the API docs](../api/graphcache.md#cache). On this page
  we use it frequently to read from and write to the cache.
- `info`: This argument shouldn't be used frequently but it contains running information about the
  traversal of the query document. It allows us to make resolvers reusable or to retrieve
  information about the entire query. Its full API can be found [in the API
  docs](../api/graphcache.md#info).

The cache updaters return value is disregarded (and typed as `void` in TypeScript), which makes any
method that they call on the `cache` instance a side-effect, which may trigger additional cache
changes and updates all affected queries as we modify them.

## Data Updates

The `updates` configuration is similar to our `resolvers` configuration that we've [previously looked
at on the "Local Resolvers" page.](./local-resolvers.md) We pass a resolver-like function into the
configuration that receives cache-specific arguments. Instead of the `parent` argument we'll however
receive the subscription's or mutation's `data` instead.

```js
const cache = cacheExchange({
  updates: {
    Mutation: {
      addTodo: (result, args, cache, info) => {
        // ...
      },
    },
    Subscription: {
      newTodo: (result, args, cache, info) => {
        // ...
      },
    },
  },
});
```

Inside these update functions, apart from the `cache` methods that we've seen on the ["Local
Resolvers" page](./local-resolvers.md) to read from the cached data, we can also use other `cache` methods to
write to the cached data.

### cache.updateQuery

The first we'll look at is `cache.updateQuery`. This method accepts a `{ query, variables }` object
as the first argument and an updater callback as the second. The updater function receives the query
data as its' only argument and must return the updated version of said data.

Note that we don't have to update the query data immutably. _Graphcache_ never returns raw data and
will instead always return copies of data. This means that we can also mutate query data inside the
`updateQuery` callback.

```js
const TodosQuery = gql`
  query {
    __typename
    todos {
      __typename
      id
      text
      complete
    }
  }
`;

const cache = cacheExchange({
  updates: {
    Mutation: {
      addTodo: (result, args, cache, info) => {
        cache.updateQuery({ query: TodosQuery }, data => {
          data.todos.push(result.addTodo);
          return data;
        });
      },
    },
  },
});
```

In the above example, we add an updater configuration for `Mutation.addTodo`. Whenever a mutation's
result contains `addTodo` our new updater will be called.

Inside the updater we use `cache.updateQuery` to update a list of todos with the new todo that has
been created by `addTodo`, which we can access using `result.addTodo`.
We could also alter this todo before returning our updated `data`.

With this configuration any query that requests `Query.todos` will automatically update and contain
our new todo, when a mutation with `Mutation.addTodo` completes.

It's worth noting that it doesn't matter whether the `TodosQuery` is the same one that you use in
your application code. We're simply updating the normalized data of `Query.todos` across the
normalized store, which will be reflected in any query that depends on `Query.todos`.

### cache.writeFragment

Similar to `cache.updateQuery`, we can also update data for a fragment using `cache.writeFragment`,
instead of an entire query. This method accepts a GraphQL fragment instead of an entire GraphQL
query. It's also not an updater method but a direct write method instead.

The first argument for `cache.writeFragment`, similarly to `readFragment`, must be a GraphQL
fragment. The second argument is the data that should be written to the cache. This data object must
contain `id` or another field if the type has a custom `keys` configuration.

```js
import { gql } from '@urql/core';

cache.writeFragment(
  gql`
    fragment _ on Todo {
      id
      text
    }
  `,
  {
    id: '1',
    text: 'update',
  }
);
```

> **Note:** In the above example, we've used
> [the `gql` tag function](../api/core.md#gql) because `writeFragment` only accepts
> GraphQL `DocumentNode`s as inputs, and not strings.

This can be useful for instance if we have a mutation that doesn't return the type that the GraphQL
API will alter in the background. Suppose we had a `updateTodoText` mutation that doesn't allow us
to access the updated `Todo`. In such a case `cache.writeFragment` allows us to make the change
manually:

```js
import { gql } from '@urql/core';

const cache = cacheExchange({
  updates: {
    Mutation: {
      updateTodoText: (result, args, cache, info) => {
        cache.writeFragment(
          gql`
            fragment _ on Todo {
              id
              text
            }
          `,
          { id: args.id, text: args.text }
        );
      },
    },
  },
});
```

In this example we haven't used `result` at all, but have written to a `Todo` fragment using the
arguments (`args`) that have been supplied to `Mutation.updateTodoText`. This can also be used in
combination with `cache.readFragment` or `cache.resolve` if we need to retrieve arbitrary data from
the cache, before using `cache.writeFragment` to update some data.

## cache.invalidate

The `cache.invalidate` method is useful for evicting a single entity from the cache. When a user
logs out or a mutation deletes an item from a list it can be tedious to update every link in our
normalized data to said entity, instead the `cache.invalidate` method can be used to quickly remove
the entity itself.

Note that this may lead to an additional request to the GraphQL API, unless you're making use of the
["Schema Awareness" feature](./schema-awareness.md), since deleting an entity may cause cache
misses for all queries that depend on this entity.

```js
const cache = cacheExchange({
  updates: {
    Mutation: {
      deleteTodo: (result, args, cache, info) => {
        cache.invalidate({ __typename: 'Todo', id: args.id });
      },
    },
  },
});
```

The above example deletes a `Todo` with a given `id` from the arguments, when `Mutation.deleteTodo`
is executed. This will cause all queries that reference this `Todo` to automatically update.

## cache.inspectFields

It's possible that you may have to alter multiple parts of the normalized cache data all at once.
For instance, you may want to see a field that has been called with different arguments, like a listing
field. The `cache.inspectFields` method was made for this purpose and is able to return all fields
that the cache has seen on a given type.

In this example we'll alter all fields on `Query.todos`:

```js
const cache = cacheExchange({
  updates: {
    Mutation: {
      addTodo: (result, args, cache, info) => {
        // Get all children of query, this can also be Todo if we would be looking for for instance the author subquery
        const allFields = cache.inspectFields("Query");
        // Filter these children to the query you like, in our case query { todos }
        const todoQueries = allFields.filter(x => x.fieldName === "todos");

        todosQueries.forEach(({ arguments }) => {
          cache.updateQuery(
            { query: TODOS_QUERY, variables: arguments },
            data => {
              data.todos.push(result.addTodo);
              return data;
            });
          );
        })
      },
    },
  },
});
```

Let's combine the above example with invalidating fields, imagine the scenario where we add a todo but
rather than manually pushing it on all the lists we just want to refetch the lists.

```js
const cache = cacheExchange({
  updates: {
    Mutation: {
      addTodo: (result, args, cache, info) => {
        const todosQueries = cache.inspectFields('Query').filter(x => x.fieldName === 'todos');

        todosQueries.forEach(({ fieldName, arguments: variables }) => {
          cache.invalidate('Query', fieldName, variables);
        });
      },
    },
  },
});
```

Now when we come onto a list we'll know that this list needs to be refetched.

### Inspecting a sub-field

We've seeen how to inspect fields for a root-field in the above, but what if your query looks like this:

```
query {
  todo(id: "x") {
    id
    authors {
      id
      name
    }
  }
}
```

Now we'd need to traverse all the `todos` to find which we need, but there's another solution.
Rather than use `cache.inspectFields('Query')`, which would give us all queried `todo` fields with their arguments, we can instead provide an object as the argument to `inspectFields` asking for all `Todo` types for a given id.

```js
cache.inspectFields({ __typename: 'Todo', id: args.id });
```

Now we'll get all fields for the given `todo` and can freely update the `authors`.

## Optimistic updates

If we know what result a mutation may return, why wait for the GraphQL API to fulfill our mutations?
The _Optimistic Updates_ configuration allows us to set up "temporary" results for mutations, which
will be applied immediately. This is a great solution to reduce the waiting time for the user.

> Note that an optimistic response is meant to be a temporary update to an entity until the server responds to your mutation.
> This means that what you return here should reflect the shape of what the server will return.

This technique is often used with one-off mutations that are assumed to succeed, like starring a
repository, or liking a tweet. In such cases it's often desirable to make the interaction feel
as instant as possible.

The `optimistic` configurations are similar to `resolvers` as well. We supply an function to
`Mutation` fields that must return some data. When said mutation is then executed, _Graphcache_
applies a temporary update using the supplied optimistic data that is reverted when the real
mutation completes and an actual result comes back from the API. The temporary update is also
reverted if the GraphQL mutation fails.

The `optimistic` functions receive the same arguments as `resolvers` functions, except for `parent`:

- `variables` – The variables used to execute the mutation.
- `cache` – The cache we've already seen in [resolvers](./local-resolvers.md) and in the previous
  examples on this page. In optimistic updates it's useful to retrieve more data from the cache.
- `info` – Contains the used fragments and field arguments.

In the following example we assume that we'd like to implement an optimistic result for a
`favoriteTodo` mutation, which sets `favorite` on a `Todo` to `true`:

```js
const cache = cacheExchange({
  optimistic: {
    favoriteTodo: (variables, cache, info) => ({
      __typename: 'Todo',
      id: variables.id,
      favorite: true,
    }),
  },
});
```

Since we return an assumed result in our `optimistic` configuration, `Mutation.favoriteTodo` will be
automatically applied and `favorite` will seemingly flip to `true` instantly for the queries that
observe `Todo.query`.

### Reading on

[On the next page we'll learn about "Schema-awareness".](./schema-awareness.md)
