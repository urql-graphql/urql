# Optimistic

Let's say we want to work offline or we don't want to wait for
responses from the server.

Optimistic responses can be a great solution to this problem. Optimisitc
responses are simply a mapping of the name of a mutation to a function.
This function gets three
arguments:

- `variables` – The variables used to execute the mutation.
- `cache` – The cache we've already seen in [resolvers](./resolvers.md) and
  [updates](./updates.md). This can be used to get a certain entity/property
  from the cache.
- `info` – Contains the used fragments and field arguments.

Let's see an example.

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
will be removed and the response from the server will be used to
replace the original properties.
