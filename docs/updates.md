# Updates

When the cache receives a response it will try and do its best to
incorporate that response into the current cache. However, for adding and
deleting entities it can't really make assumptions.

That's where updates come into play. Analogous to our `resolvers`,
`updates` get arguments, but instead of the `parent` argument we get the
result given from the server due to a subscription trigger or a mutation.

Let's look at two additional methods provided by the cache to enable
updates.

The first we'll look at is `updateQuery`. This method, given a query and a result,
updates the cache.

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

cache.updateQuery(Todos, data => {
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
        cache.updateQuery(Todos, data => {
          data.todos.push(result);
          return data;
        });
      },
    },
    Subscription: {
      newTodo: (result, args, cache) => {
        cache.updateQuery(Todos, data => {
          data.todos.push(result);
          return data;
        });
      },
    },
  },
});
```

[Back](../README.md)
