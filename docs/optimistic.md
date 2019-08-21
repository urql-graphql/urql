# Optimistic

Let's say we want to work offline or we don't want to wait for
responses from the server.

Here we have optimistic responses as the solution. This is a mapping
of the name of the mutation to a function. This function gets three
arguments:

- variables: The variables used to execute the mutation
- cache: The cache we've already seen in [resolvers](./resolvers.md) and
  [updates](./updates.md). This can be used to get a certain entity/property
  from the cache.
- info: Contains the used fragments and field arguments.

Let's approach this from an example.

```js
const myGraphCache = cacheExchange({
  optimistic: {
    addTodo: (variables, cache, info) => {
      console.log(variables); // { id: '1', text: 'optimistic', __typename: 'Todo' }
      return variables;
    },
  },
});
```

Now that we return variables our `Todo:1` will be updated to have
the new `text` property. In our cache this will form a layer above
the property. When a response from the server comes in this layer
will be removed and the response from the server will be used to
replace the original properties.
