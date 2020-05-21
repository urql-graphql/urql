---
'next-urql': major
---

Transform the `withUrqlClient` function, this removes the second argument formerly called `mergeExchanges` and merges it with the first argument.
The first argument will only accept functions from now on.

To migrate you would transform from:

```js
export default withUrqlClient(
  ctx => ({
    url: '',
  }),
  ssrExchange => [exchanges]
);
```

to

```js
export default withUrqlClient((ssrExchange, ctx) => ({
  url: '',
  exchanges: [exchanges],
}));
```
