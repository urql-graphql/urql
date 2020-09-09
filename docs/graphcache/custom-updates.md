---
title: Custom Updates
order: 3
---

# Custom Updates

Every time Graphcache sees a result from the API for a `subscription` or a `mutation` it will look at the response and traverse it.
This process is the same as for queries but instead of starting at the Query root type,
it will start searching for keyable entities, where an object's `__typename` and `id` or `_id` fields (or a custom keys config)
are provided, so it can write normalized entities to the cache.

A normalized cache can't automatically assume that unrelated links have changed due to
a mutation, since this is server-side specific logic. Instead, we may use the `updates`
configuration to set up manual updates that react to mutations or subscriptions.

## Data Updates

The `updates` configuration is similar to our `resolvers` configuration that we've [previously looked
at on the "Computed Queries" page.](./computed-queries.md) We pass a resolver-like function into the
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

Inside these update functions, apart from the `cache` methods that we've seen in ["Computed
Query"](./computed-queries.md) to read from the cached data, we can also use other `cache` methods to
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
import gql from 'graphql-tag';

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
> [graphql-tag](https://github.com/apollographql/graphql-tag) because `writeFragment` only accepts
> GraphQL `DocumentNode`s as inputs, and not strings.

This can be useful for instance if we have a mutation that doesn't return the type that the GraphQL
API will alter in the background. Suppose we had a `updateTodoText` mutation that doesn't allow us
to access the updated `Todo`. In such a case `cache.writeFragment` allows us to make the change
manually:

```js
import gql from 'graphql-tag';

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
            { query: TODOS_QUERY, variables: x.arguments },
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
        const todoQueries = cache.inspectFields('Query').filter(x => x.fieldName === 'todos');

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
- `cache` – The cache we've already seen in [resolvers](./computed-queries.md) and in the previous
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
