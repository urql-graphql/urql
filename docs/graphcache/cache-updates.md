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

## Manually updating entities

If a mutation field's result isn't returning the full entity it updates then it becomes impossible
for Graphcache to update said entity automatically. For instance, we may have a mutation like the
following:

```graphql
mutation UpdateTodo ($todoId: ID!, $date: String!) {
  updateTodoDate(id: $todoId, date: $date)
}
```

In this hypothetical case instead of `Mutation.updateDate` resolving to the full `Todo` object type
it instead results in a scalar. This could be fixed by changing the `Mutation` in our API's schema
to instead return the full `Todo` entity, which would allow us to run the mutation as such, which
updates the `Todo` in our cache automatically:

```graphql
mutation UpdateTodo($todoId: ID!, $date: String!) {
  updateTodoDate(id: $todoId, date: $date) {
    ...Todo_date
  }
}

fragment Todo_date on Todo {
  id
  updatedAt
}
```

However, if this isn't possible we can instead write an updater that updates our `Todo` entity
manually by using the `cache.writeFragment` method:

```js
import { gql } from '@urql/core';

cacheExchange({
  updates: {
    Mutation: {
      updateTodoDate(result, args, cache, info) {
        const fragment = gql`
          fragment _ on Todo {
            id
            updatedAt
          }
        `;

        cache.writeFragment(
          fragment,
          { id: args.id, updatedAt: args.date },
        );
      },
    },
  },
});
```

The `cache.writeFragment` method is similar to the `cache.readFragment` method that we've seen [on
the "Local Resolvers" page before](./local-resolvers.md#reading-a-fragment). Instead of reading data
for a given fragment it instead writes data to the cache.

### Cache Updates outside of updates

Cache updates are **not** possible outside of `updates`. If we attempt to store the `cache` in a
variable and call its methods outside of any `updates` functions (or functions, like `resolvers`)
then Graphcache will throw an error.

Methods like these cannot be called outside of the `cacheExchange`'s `updates` functions, because
all updates are isolated to be _reactive_ to mutations and subscription events. In Graphcache,
out-of-band updates aren't permitted because the cache attempts to only represent the server's
state. This limitation keeps the data of the cache true to the server data we receive from API
results and makes its behaviour much more predictable.

If we still manage to call any of the cache's methods outside of its callbacks in its configuration,
we will receive [a "(2) Invalid Cache Call" error](./errors.md#2-invalid-cache-call).

## Updating lists or links

Mutations that create new entities are pretty common, and it's not uncommon to attempt to update the
cache when a mutation result for these "creation" mutations come back, since this avoids an
additional roundtrip to our APIs.

While it's possible for these mutations to return any affected entities that carry the lists as
well, often these lists live on fields on or below the `Query` root type, which means that we'd be
sending a rather large API result. For large amounts of pages this is especially infeasible.
Instead, most schemas opt to instead just return the entity that's just been created:

```graphql
mutation NewTodo ($text: String!) {
  createTodo(id: $todoId, text: $text) {
    id
    text
  }
}
```

If we have a corresponding field on `Query.todos` that contains all of our `Todo` entities then this
means that we'll need to create an updater that automatically adds the `Todo` to our list:

```js
cacheExchange({
  updates: {
    Mutation: {
      updateTodoDate(result, args, cache, info) {
        const TodoList = gql`{ todos { id } }`;

        cache.updateQuery({ query: TodoList }, data => {
          data.todos.push(result.createTodo);
          return data;
        });
      },
    },
  },
});
```

Here we use the `cache.updateQuery` method, which is similar to the `cache.readQuery` method that
we've seen on the "Local Resolvers" page before](./local-resolvers.md#reading-a-query).

This method accepts a callback which will give us the `data` of the query, as read from the locally
cached data and we may return an updated version of this data. While we may want to instinctively
opt for immutably copying and modifying this data, we're actually allowed to mutate it directly,
since it's just a copy of the data that's been read by the cache.

This `data` may also be `null` if the cache doesn't actually have enough locally cached information
to fulfil the query. This is important because resolvers aren't actually applied to cache methods in
updaters. All resolvers are ignored so it becomes impossible to accidentally commit transformed data
to our cache. We could safely add a resolver for `Todo.createdAt` and wouldn't have to worry about
an updater accidentally writing it to the cache's internal data structure.

## Updating many unknown links

In the previous section we've seen how to update data, like a list, when a mutation result enters
the cache. However, we've used a rather simple example when we've looked at a single list on a known
field.

In many schemas pagination is quite common and when we for instance delete a todo then knowing which
list to update becomes unknowable. We cannot know ahead of time how many pages (and using which
variables) we've already accessed. This knowledge in fact _shouldn't_ be available to Graphcache.
Querying the `Client` is an entirely separate concern that's often colocated with some part of our
UI code.

```graphql
mutation RemoveTodo ($id: ID!) {
  removeTodo(id: $id)
}
```

Suppose we have the above mutation which deletes a `Todo` entity by its ID. Our app may query a list
of these items over many pages with separate queries being sent to our API, which makes it hard to
know which fields should be checked:

```graphql
query PaginatedTodos ($skip: Int) {
  todos(skip: $skip) {
    id
    text
  }
}
```

Instead, we can **introspect an entity's fields** to find out dynamically which fields we may want
to update. This is possible thanks to [the `cache.inspectFields`
method](../api/graphcache.md#inspectfields). This method accepts a key or a keyable entity like the
`cache.keyOfEntity` method that [we've seen on the "Local Resolvers"
page](./local-resolvers.md#resolving-by-keys) or the `cache.resolve` method's first argument.

```js
cacheExchange({
  updates: {
    Mutation: {
      removeTodo(result, args, cache, info) {
        const TodoList = gql`
          query (skip: $skip) {
            todos(skip: $skip) { id }
          }
        `;

        const fields = cache.inspectFields('Query')
          .filter(field => field.fieldName === 'todos')
          .forEach(field => {
            cache.updateQuery(
              {
                query: TodoList,
                variables: { skip: field.arguments.skip },
              },
              data => {
                data.todos = data.todos.filter(todo => todo.id !== args.id);
                return data;
              }
            });
          });
      },
    },
  },
});
```

To implement an updater for our example's `removeTodo` mutation field we may use the
`cache.inspectFields('Query')` method to retrieve a list of all fields on the `Query` root entity.
This list will contain all known fields on the `"Query"` entity. Each field is described as an
object with three properties:

- `fieldName`: The field's name; in this case we're filtering for all `todos` listing fields.
- `arguments`: The arguments for the given field, since each field that accepts arguments can be
  accessed multiple times with different arguments. In this example we're looking at
  `arguments.skip` to find all unique pages.
- `fieldKey`: This is the field's key which can come in useful to retrieve a field using
  `cache.resolve(entityKey, fieldKey)` to prevent the arguments from having to be stringified
  repeatedly.

To summarise, we filter the list of fields in our example down to only the `todos` fields and
iterate over each of our `arguments` for the `todos` field to filter all lists to remove the `Todo`
from them.

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
