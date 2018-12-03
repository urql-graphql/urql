## Exchanges 101

### What is an Exchange?

In urql, we use the concept of exchanges as an extensible way of handling GraphQL operations. In short an exchange will receive an operation from the client and do one of two actions: _forward the operation_ to the next exchange or _return the result_ to the client.

### Do I need to make my own exchanges?

Not at all. Unless otherwise specified, the following exchanges will be in use by default:

- _dedupExchange_ - Debounces Query operations
- _cacheExchange_ - Manages caching and refreshing of Query operations
- _fetchExchange_ - Communicates with the GraphQL server over HTTP/s.

While these exchanges cover most use cases, you can make your own additional exchanges and use them in your application. Additional exchanges could add functionality such as stubbing responses (for use during development), client side monitoring, request metadata injection, etc.

## Making your own exchange

Before you begin, we strongly advise you check out our [exchanges directory](https://github.com/FormidableLabs/urql/tree/master/src/exchanges) for some examples. It is also advised that you write your exchanges in Typescript - it will help you a lot!

### Architecture

```js
const myExchange = ({ forward, subject }) => (ops$) => ...
```

An exchange (as demonstrated above) will receive a single argument with two values:

- _forward_ - The next Exchange(IO) in the list
- _subject_ - The subject from which Operations are published

The exchange will return an _ExchangeIO_ - a function which takes a stream of _Operations_ and returns an _Observable\<ExchangeResult\>_.

![Exchanges diagram](https://user-images.githubusercontent.com/10779424/49379718-b8ad5880-f707-11e8-874e-411e7a6486d5.png)

The image above demonstrates how an _Operation_ gets from a client to an _Exchange_.

### Example: Mutation Logger

Consider the following use case - Every time a unique mutation operation occurs, it to the console. Given we want to add this functionality into urql, we will need to make an exchange.

```jsx
const mutationLogExchange = ({ forward }) => {
  let previousMutations = [];

  // ...
};
```

The first function call of our _Exchange_ is executed only once (when the client is created) - so this is a great time to instantiate our array of previous mutations.

```jsx
// ...
return ops$ =>
  ops$.pipe(
    tap(operation => {
      const { operationName, key } = operation;

      if (operationName === 'mutation' && !previousMutations.includes(key)) {
        console.log(operation);
        previousMutations = [...previousMutations, key];
      }
    })
  );
```

In the body of our exchange function, we need to pipe the operation stream in order to listen for mutation operations, add them to our array and print them. Our functional implementation is now complete, but we probably want to forward said operation to the next exchange - to actually execute the operation.

```jsx
export const mutationLogExchange = ({ forward }) => {
  let previousMutations = [];

  return ops$ =>
    forward(
      ops$.pipe(
        tap(operation => {
          const { operationName, key } = operation;

          if (
            operationName === 'mutation' &&
            !previousMutations.includes(key)
          ) {
            console.log(operation);
            previousMutations = [...previousMutations, key];
          }
        })
      )
    );
};
```

Using the forward function provided at runtime, we are able to forward our piped stream to the next _Exchange_. That's our Exchange implementation complete! The only thing left is to use the Exchange in our client.

```jsx
import {
  createClient,
  dedupExchange,
  cacheExchange,
  fetchExchange,
} from 'urql';
import { mutationLogExchange } from './exchanges';

const client = createClient({
  url: 'https://my-host:8080/graphql',
  exchanges: [dedupExchange, cacheExchange, mutationLogExchange, fetchExchange],
});

// ..
```

The new exchange has been added to the client and we now see all unique mutations being printed to the console!
