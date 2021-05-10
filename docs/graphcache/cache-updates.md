---
title: Cache Updates
order: 3
---

# Cache Updates

As we've learned [on the page on "Normalized
Caching"](./normalized-caching.md#normalizing-relational-data), when Graphcache receives an API
result it will traverse and store all its data to its cache in a normalised structure. Each entity
that is found in a result will be stored under the entity's key.

A query's result is represented as a graph, which can also be understood as a tree structure,
starting from the root `Query` entity, which then connects to other entities via links, which are
relations stored as keys, where each entity has records that store scalar values, which are the
tree's leafs. On the previous page, on ["Local Resolvers"](./local-resolvers.md), we've seen how
resolvers can be attached to fields to manually resolve other entities (or transform record fields).
Local Resolvers passively _compute_ results and change how Graphcache traverses and sees its locally
cached data, however, for **mutations** and **subscriptions** we cannot passively compute data.

When Graphcache receives a mutation or subscription result it still traverses it using the query
document as we've learned when reading about how Graphcache stores normalized data,
[quote](./normalized-caching.md/#storing-normalized-data):

> Any mutation or subscription can also be written to this data structure. Once Graphcache finds a
> keyable entity in their results it's written to its relational table, which may update other
> queries in our application.

This means that mutations and subscriptions still write and update entities in the cache. These
updates are then reflected on all active queries that our app uses. However, there are limitations to this.
While resolvers can be used to passively change data for queries, for mutations
and subscriptions we sometimes have to write **updaters** to update links and relations.
This is often necessary when a given mutation or subscription deliver a result that is more granular
than the cache needs to update all affected entities.

Previously, we've learned about cache updates [on the "Normalized Caching"
page](./normalized-caching.md#manual-cache-updates).

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
});
```

An "updater" may be attached to a `Mutation` or `Subscription` field and accepts four positional
arguments, which are the same as [the resolvers' arguments](./local-resolvers.md):

- `result`: The full API result that's being written to the cache. Typically we'd want to
  avoid coupling by only looking at the current field that the updater is attached to, but it's
  worth noting that we can access any part of the result.
- `args`: The arguments that the field has been called with, which will be replaced with an empty
  object if the field hasn't been called with any arguments.
- `cache`: The `cache` instance, which gives us access to methods allowing us to interact with the
  local cache. Its full API can be found [in the API docs](../api/graphcache.md#cache). On this page
  we use it frequently to read from and write to the cache.
- `info`: This argument shouldn't be used frequently, but it contains running information about the
  traversal of the query document. It allows us to make resolvers reusable or to retrieve
  information about the entire query. Its full API can be found [in the API
  docs](../api/graphcache.md#info).

The cache updaters return value is disregarded (and typed as `void` in TypeScript), which makes any
method that they call on the `cache` instance a side effect, which may trigger additional cache
changes and updates all affected queries as we modify them.

## Manually updating entities

If a mutation field's result isn't returning the full entity it updates then it becomes impossible
for Graphcache to update said entity automatically. For instance, we may have a mutation like the
following:

```graphql
mutation UpdateTodo($todoId: ID!, $date: String!) {
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
      updateTodoDate(_result, args, cache, _info) {
        const fragment = gql`
          fragment _ on Todo {
            id
            updatedAt
          }
        `;

        cache.writeFragment(fragment, { id: args.id, updatedAt: args.date });
      },
    },
  },
});
```

The `cache.writeFragment` method is similar to the `cache.readFragment` method that we've seen [on
the "Local Resolvers" page before](./local-resolvers.md#reading-a-fragment). Instead of reading data
for a given fragment it instead writes data to the cache.

> **Note:** In the above example, we've used
> [the `gql` tag function](../api/core.md#gql) because `writeFragment` only accepts
> GraphQL `DocumentNode`s as inputs, and not strings.

### Cache Updates outside updaters

Cache updates are **not** possible outside `updates`'s functions. If we attempt to store the `cache`
in a variable and call its methods outside any `updates` functions (or functions, like `resolvers`)
then Graphcache will throw an error.

Methods like these cannot be called outside the `cacheExchange`'s `updates` functions, because
all updates are isolated to be _reactive_ to mutations and subscription events. In Graphcache,
out-of-band updates aren't permitted because the cache attempts to only represent the server's
state. This limitation keeps the data of the cache true to the server data we receive from API
results and makes its behaviour much more predictable.

If we still manage to call any of the cache's methods outside its callbacks in its configuration,
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
mutation NewTodo($text: String!) {
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
      updateTodoDate(result, _args, cache, _info) {
        const TodoList = gql`
          {
            todos {
              id
            }
          }
        `;

        cache.updateQuery({ query: TodoList }, data => {
          data.todos.push(result.createTodo);
          return data;
        });
      },
    },
  },
});
```

Here we use the `cache.updateQuery` method, which is similar to the [`cache.readQuery` method](./local-resolvers.md#reading-a-query) that
we've seen on the "Local Resolvers" page before.

This method accepts a callback, which will give us the `data` of the query, as read from the locally
cached data, and we may return an updated version of this data. While we may want to instinctively
opt for immutably copying and modifying this data, we're actually allowed to mutate it directly,
since it's just a copy of the data that's been read by the cache.

This `data` may also be `null` if the cache doesn't actually have enough locally cached information
to fulfil the query. This is important because resolvers aren't actually applied to cache methods in
updaters. All resolvers are ignored, so it becomes impossible to accidentally commit transformed data
to our cache. We could safely add a resolver for `Todo.createdAt` and wouldn't have to worry about
an updater accidentally writing it to the cache's internal data structure.

### Writing links individually

As long as we're only updating links (as in 'relations') then we may also use the [`cache.link`
method](../api/graphcache.md#link). This method is the "write equivalent" of [the `cache.resolve`
method, as seen on the "Local Resolvers" page before.](./local-resolvers.md#resolving-other-fields)

We can use this method to update any relation in our cache, so the example above could also be
rewritten to use `cache.link` and `cache.resolve` rather than `cache.updateQuery`.

```js
cacheExchange({
  updates: {
    Mutation: {
      updateTodoDate(result, _args, cache, _info) {
        const todos = cache.resolve('Query', 'todos');
        if (Array.isArray(todos)) {
          todos.push(result.createTodo);
          cache.link('Query', 'todos', todos);
        }
      },
    },
  },
});
```

This method can be combined with more than just `cache.resolve`, for instance, it's a good fit with
`cache.inspectFields`. However, when you're writing records (as in 'scalar' values)
`cache.writeFragment` and `cache.updateQuery` are still the only methods that you can use.
But since this kind of data is often written automatically by the normalized cache, often updating a
link is the only modification we may want to make.

## Updating many unknown links

In the previous section we've seen how to update data, like a list, when a mutation result enters
the cache. However, we've used a rather simple example when we've looked at a single list on a known
field.

In many schemas pagination is quite common, and when we for instance delete a todo then knowing the
lists to update becomes unknowable. We cannot know ahead of time how many pages (and its variables)
we've already accessed. This knowledge in fact _shouldn't_ be available to Graphcache. Querying the
`Client` is an entirely separate concern that's often colocated with some part of our
UI code.

```graphql
mutation RemoveTodo($id: ID!) {
  removeTodo(id: $id)
}
```

Suppose we have the above mutation, which deletes a `Todo` entity by its ID. Our app may query a list
of these items over many pages with separate queries being sent to our API, which makes it hard to
know the fields that should be checked:

```graphql
query PaginatedTodos($skip: Int) {
  todos(skip: $skip) {
    id
    text
  }
}
```

Instead, we can **introspect an entity's fields** to find the fields we may want to update
dynamically. This is possible thanks to [the `cache.inspectFields`
method](../api/graphcache.md#inspectfields). This method accepts a key, or a keyable entity like the
`cache.keyOfEntity` method that [we've seen on the "Local Resolvers"
page](./local-resolvers.md#resolving-by-keys) or the `cache.resolve` method's first argument.

```js
cacheExchange({
  updates: {
    Mutation: {
      removeTodo(_result, args, cache, _info) {
        const TodoList = gql`
          query (skip: $skip) {
            todos(skip: $skip) { id }
          }
        `;

        const fields = cache
          .inspectFields('Query')
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
            );
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
- `fieldKey`: This is the field's key, which can come in useful to retrieve a field using
  `cache.resolve(entityKey, fieldKey)` to prevent the arguments from having to be stringified
  repeatedly.

To summarise, we filter the list of fields in our example down to only the `todos` fields and
iterate over each of our `arguments` for the `todos` field to filter all lists to remove the `Todo`
from them.

### Inspecting arbitary entities

We're not required to only inspecting fields on the `Query` root entity. Instead, we can inspect
fields on any entity by passing a different partial, keyable entity or key to `cache.inspectFields`.

For instance, if we had a `Todo` entity and wanted to get all of its known fields then we could pass
in a partial `Todo` entity just as well:

```js
cache.inspectFields({
  __typename: 'Todo',
  id: args.id,
});
```

## Invalidating Entities

Admittedly, it's sometimes almost impossible to write updaters for all mutations. It's often even
hard to predict what our APIs may do when they receive a mutation. An update of an entity may change
the sorting of a list, or remove an item from a list in a way we can't predict, since we don't have
access to a full database to run the API locally.

In cases like these it may be advisable to trigger a refetch instead and let the cache update itself
by sending queries that have invalidated data associated to them to our API again. This process is
called **invalidation** since it removes data from Graphcache's locally cached data.

We may use the cache's [`cache.invalidate` method](../api/graphcache.md#invalidate) to either
invalidate entire entities or individual fields. It has the same signature as [the `cache.resolve`
method](../api/graphcache.md#resolve), which we've already seen [on the "Local Resolvers" page as
well](./local-resolvers.md#resolving-other-fields). We can simplify the previous update we've written
with a call to `cache.invalidate`:

```js
cacheExchange({
  updates: {
    Mutation: {
      removeTodo(_result, args, cache, _info) {
        cache.invalidate({
          __typename: 'Todo',
          id: args.id,
        });
      },
    },
  },
});
```

Like any other cache update, this will cause all queries that use this `Todo` entity to be updated
against the cache. Since we've invalidated the `Todo` item they're using these queries will be
refetched and sent to our API.

If we're using ["Schema Awareness"](./schema-awareness.md) then these queries' results may actually
be temporarily updated with a partial result, but in general we should observe that queries with
data that has been invalidated will be refetched as some of their data isn't cached anymore.

### Invalidating individual fields

We may also want to only invalidate individual fields, since maybe not all queries have to be
immediately updated. We can pass a field (and optional arguments) to the `cache.invalidate` method
as well to only invalidate a single field.

For instance, we can use this to invalidate our lists instead of invalidating the entity itself.
This can be useful if we know that modifying an entity will cause our list to be sorted differently,
for instance.

```js
cacheExchange({
  updates: {
    Mutation: {
      updateTodo(_result, args, cache, _info) {
        const key = 'Query';
        const fields = cache
          .inspectFields(key)
          .filter(field => field.fieldName === 'todos')
          .forEach(field => {
            cache.invalidate(key, field.fieldKey);
            // or alternatively:
            cache.invalidate(key, field.fieldName, field.arguments);
          });
      },
    },
  },
});
```

In this example we've attached an updater to a `Mutation.updateTodo` field. We react to this
mutation by enumerating all `todos` listing fields using `cache.inspectFields` and targetedly
invalidate only these fields, which causes all queries using these listing fields to be refetched.

## Optimistic updates

If we know what result a mutation may return, why wait for the GraphQL API to fulfill our mutations?

Additionally to the `updates` configuration we may also pass an `optimistic` option to the
`cacheExchange` which is a factory function using, which we can create a "virtual" result for a
mutation. This temporary result can be applied immediately to the cache to give our users the
illusion that mutations were executed immediately, which is a great method to reduce waiting time
and to make our apps feel snappier.
This technique is often used with one-off mutations that are assumed to succeed, like starring a
repository, or liking a tweet. In such cases it's often desirable to make the interaction feel
as instant as possible.

The `optimistic` configuration is similar to our `resolvers` or `updates` configuration, except that
it only receives a single map for mutation fields. We can attach optimistic functions to any
mutation field to make it generate an optimistic that is applied to the cache while the `Client`
waits for a response from our API. An "optimistic" function accepts three positional arguments,
which are the same as the resolvers' or updaters' arguments, except for the first one:

The `optimistic` functions receive the same arguments as `updates` functions, except for `parent`,
since we don't have any server data to work with:

- `args`: The arguments that the field has been called with, which will be replaced with an empty
  object if the field hasn't been called with any arguments.
- `cache`: The `cache` instance, which gives us access to methods allowing us to interact with the
  local cache. Its full API can be found [in the API docs](../api/graphcache.md#cache). On this page
  we use it frequently to read from and write to the cache.
- `info`: This argument shouldn't be used frequently, but it contains running information about the
  traversal of the query document. It allows us to make resolvers reusable or to retrieve
  information about the entire query. Its full API can be found [in the API
  docs](../api/graphcache.md#info).

The usual `parent` argument isn't present since optimistic functions don't have any server data to
handle or deal with and instead create this data. When a mutation is run that contains one or more
optimistic mutation fields, Graphcache picks these up and generates immediate changes, which it
applies to the cache. The `resolvers` functions also trigger as if the results were real server
results.

This modification is temporary. Once a result from the API comes back it's reverted, which leaves us
in a state where the cache can apply the "real" result to the cache.

> Note: While optimistic mutations are waiting for results from the API all queries that may alter
> our optimistic data are paused (or rather queued up) and all optimistic mutations will be reverted
> at the same time. This means that optimistic results can stack but will never accidentally be
> confused with "real" data in your configuration.

In the following example we assume that we'd like to implement an optimistic result for a
`favoriteTodo` mutation. The mutation is rather simple and all we have to do is create a function
that imitates the result that the API is assumed to send back:

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

This optimistic mutation will be applied to the cache. If any `updates` configuration exists for
`Mutation.favoriteTodo` then it will be executed using the optimistic result.
Once the mutation result comes back from our API this temporary change will be rolled back and
discarded.

It's important to ensure that our optimistic mutations return all data that the real mutation may
return. If our mutations request a field in their selection sets that our optimistic mutation
doesn't contain then we'll see a warning, since this is a common mistake. To work around not having
enough data we may use methods like `cache.readFragment` and `cache.resolve` to retrieve more data
from our cache.

### Variables for Optimistic Updates

Sometimes it's not possible for us to retrieve all data that an optimistic update requires to create
a "fake result" from the cache or from all existing variables.

This is why Graphcache allows for a small escape hatch for these scenarios, which allows us to access
additional variables, which we may want to pass from our UI code to the mutation. For instance, given
a mutation like the following we may add more variables than the mutation specifies:

```graphql
mutation UpdateTodo($id: ID!, $text: ID!) {
  updateTodo(id: $id, text: $text) {
    id
    text
  }
}
```

In the above mutation we've only defined an `$id` and `$text` variable. Graphcache typically filters
variables using our query document definitions, which means that our API will never receive any
variables other than the ones we've defined.

However, we're able to pass additional variables to our mutation, e.g. `{ extra }`, and since
`$extra` isn't defined it will be filtered once the mutation is sent to the API. An optimistic
mutation however will still be able to access this variable.

### Reading on

[On the next page we'll learn about "Schema Awareness".](./schema-awareness.md)
