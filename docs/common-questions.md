---
title: Common questions
order: 6
---

# Common questions

## How do we achieve asynchronous fetchOptions?

If you need `async fetchOptions` you can add an exchange that looks like this:

```js
import { makeOperation } from '@urql/core';
import { Exchange, Operation } from 'urql';
import { pipe, mergeMap, map, fromPromise, fromValue } from 'wonka';

const isPromise = (value: any): value is Promise<unknown> => {
  return typeof value.then === 'function';
};

export const fetchOptionsExchange =
  (
    fn: (fetchOptions: RequestInit) => Promise<RequestInit> | RequestInit,
  ): Exchange =>
  ({ forward }) =>
  (ops$) => {
    return pipe(
      ops$,
      mergeMap((operation: Operation) => {
        const currentOptions =
          typeof operation.context.fetchOptions === 'function'
            ? operation.context.fetchOptions()
            : operation.context.fetchOptions || {};

        const finalOptions = fn(currentOptions);

        return pipe(
          isPromise(finalOptions)
            ? fromPromise(finalOptions)
            : fromValue(finalOptions),
          map((fetchOptions) => {
            return makeOperation(operation.kind, operation, {
              ...operation.context,
              fetchOptions,
            });
          }),
        );
      }),
      forward,
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
    fetchOptionsExchange(async (fetchOptions) => {
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
