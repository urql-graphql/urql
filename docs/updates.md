# Updates

When the cache receives a response it will try and do its best to
incorporate that answer into the current cache, but for adding and
deleting entities it can't really make assumptions.

That's where updates come into play. Analogue to our `resolvers` this gets
arguments but instead of the parent argument (first one) we get the
result given from the server in response to our mutation.

Let's look at two additional methods provided by the cache to enable
updates.

The first one is named `updateQuery`, this method given a query and a result updates
the cache.

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
    text: 'Learn updates and queryResolvers',
    complete: false,
    __typename: 'Todo',
  });
  return data;
});
```

So how to interpret the above code-sample, we supply a query
to the cache, this way it can fetch the required data. Then it
will call your second argument with the data it has queried, you
can now alter this and return it. When you have returned to the
cache it will update the relevant query with your given input.

> Note that you have to supply \_\_typename.

Secondly we have `updateFragment`, this method is mainly meant so
you don't have to supply the full object every time.

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

The way to read this is, we supply a partial `Todo` having `id` or `_id`
so we know what entity you are telling the cache to update and some fields
you want to update. So in this case we update id "1" to have text "update".
The rest of the properties (complete and \_\_typename) will stay untouched.

```js
const cache = cacheExchange({
  updates: {
    addTodo: (result, arguments, cache, info) => {
      cache.updateQuery(Todos, data => {
        data.todos.push(result);
        return data;
      });
    },
  },
});
```

[Back](../README.md)
