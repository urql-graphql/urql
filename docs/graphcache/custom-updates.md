---
title: Custom Updates
order: 3
---

# Custom Updates (on Mutations or Subscriptions)

`Graphcache` will attempt to automatically react to your `mutation/subscription` results
but sometimes this isn't possible. You can assume that updating an entity
available in cache will work but we can't make assumptions about creating/deleting
entities, these scenario's will have to be handled manually. Let's take a look
how we can do this.

## Data Updates

Analog to our `resolvers`, `updates` get arguments, but instead of the
`parent` argument we get the result from the `subscription` or `mutation`.

> Note that this result will look like result.data, this means that in
> the example of us adding a todo by means of `addTodo` it will look like
> `{ addTodo: addedTodo }`.

Let's look at three additional methods provided by the cache to enable
updates.

The first we'll look at is `updateQuery`. This method, given an object
containg the query and optionally some variables as first argument and
a callback with the result from this query as the second, will update the
cache.

```js
const Todos = gql`
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

cache.updateQuery({ query: Todos, variables: { page: 1 } }, data => {
  data.todos.push({
    id: '2',
    text: 'Learn updates and resolvers',
    complete: false,
    __typename: 'Todo',
  });

  return data;
});
```

In the above code sample, we start by supplying a query to the `cache`.
This allows it to fetch the required data. This data is passed as the
second argument to the `updater`, which allows you to alter it before
returning. When you have returned to the cache it will update the relevant
query with your given input.

> Note that you have to supply \_\_typename.

The second method we have available on the `cache` is `updateFragment`.
This method allows you to supply a GraphQL fragment to update, such that you
don't have to supply the full object entity (in this case `Todo`) if you just
want to update specific fields.

```js
cache.updateFragment(
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

In the example above, we supply a fragment on `Todo` to `updateFragment`. You'll
notice we include the `id` property such that the cache knows which entity to update,
as well as the some fields we want to update. So in this case we update `Todo` with `id`
`'1'` to have text `'update'`. The rest of the properties (complete and \_\_typename)
will stay untouched.

```js
const cache = cacheExchange({
  updates: {
    Mutation: {
      addTodo: (result, args, cache, info) => {
        cache.updateQuery({ query: Todos }, data => {
          data.todos.push(result);
          return data;
        });
      },
    },
    Subscription: {
      newTodo: (result, args, cache) => {
        cache.updateQuery({ query: Todos }, data => {
          data.todos.push(result);
          return data;
        });
      },
    },
  },
});
```

The last method we'll look at is essentially an escape hatch
this is called `invalidateQuery` and accepts a `query` as
the first argument and variables for that query as the second.

This method should only be needed when a mutation has some sort
of side-effect, let's say when a user subscribes to a certain subject
that user gets an additional agenda.

This can't really be derived from the mutation response so we opt
to invalidate our agenda's as followed:

```js
const cache = cacheExchange({
  updates: {
    Mutation: {
      subscribeToSubject: (result, args, cache, info) => {
        cache.invalidateQuery(AgendasForUser, { userId: args.userId });
      },
    },
  },
});
```

Next time we hit the query for agendas the query will be refetched due to it
being invalidated.

## Optimistic updates

Optimistic responses can be a great solution to reduce waiting times or 
work offline. Optimisitc responses are a mapping of the name of a mutation to a function.
This function gets three arguments:

- `variables` – The variables used to execute the mutation.
- `cache` – The cache we've already seen in [resolvers](./computed-queries.md) and
  [updates](#Data%20updates). This can be used to get a certain entity/property
  from the cache.
- `info` – Contains the used fragments and field arguments.

Let's look at an example.

```js
const myGraphCache = cacheExchange({
  optimistic: {
    addTodo: (variables, cache, info) => {
      console.log(variables); // { id: '1', text: 'optimistic' }
      return {
        ...variables,
        __typename: 'Todo', // We still have to let the cache know what entity we are on.
      };
    },
  },
});
```

Now that we return `variables` our `Todo:1` will be updated to have
the new `text` property. In our cache this will form a layer above
the property. When a response from the server comes in this layer
will be removed and the result will be used to update the entity.
