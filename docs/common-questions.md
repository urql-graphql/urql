---
title: Common questions
order: 6
---

# Common questions

## How do we achieve asynchronous fetchOptions?

If you need `async fetchOptions` you can add an exchange that looks like this:

```js
export const fetchOptionsExchange = (fn: any): Exchange => ({ forward }) => ops$ => {
  return pipe(
    ops$,
    mergeMap((operation: Operation) => {
      const result = fn(operation.context.fetchOptions);
      return pipe(
        typeof result.then === 'function' ? fromPromise(result) : fromValue(result),
        map((fetchOptions: RequestInit | (() => RequestInit)) => ({
          ...operation,
          context: { ...operation.context, fetchOptions },
        }))
      );
    }),
    forward
  );
};
```

If we add the above exchange before our `fetchExchange` our `fetchOptions` will be handled.

```js
const client = createClient({
  url: 'http://yourUrl.dev/',
  exchanges: [
    dedupExchange,
    cacheExchange,
    fetchOptionsExchange(async (fetchOptions: any) => {
      return Promise.resolve({
        ...fetchOptions,
        headers: {
          Authorization: 'Bearer mySuperToken',
        },
      });
    }),
    fetchExchange,
  ],
});
```

This scenario can for instance occur when dealing with React-native AsyncStorage, this way we can
asynchronously get a value from there.

[Credits to @RodolfoSilva](https://github.com/FormidableLabs/urql/issues/234#issuecomment-602305153)
