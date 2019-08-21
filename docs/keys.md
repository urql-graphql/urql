# Keys

When resolving entities the graph cache will try to look at the entity
and use `id` or `_id` to identify them.

The keys property allows us to intervene in this behavior, we can point
to another location or pre-/postfix it.

Let's look at an example, we have a set of todos (typename is Todo),
but instead of identifying on `id` or `_id` we are using the `name`.

```js
const myGraphCache = cacheExchange({
  keys: {
    Todo: data => data.name,
  },
});
```

Now when we query or write a Todo it will use `name` and all others
will be resolved the traditional way.

In here you could for example say that a Todo meant only for admin
access is prefixed with `admin`.

```js
const myGraphCache = cacheExchange({
  keys: {
    Todo: data => (data.isAdminOnly ? `${admin}-${data.name}` : data.name),
  },
});
```

[Back](../README.md)
