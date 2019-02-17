# Exchanges

## Usage

You can chain together any of the following exchanges (or create your own) during client creation.

```ts
import {
  cacheExchange,
  debugExchange,
  fetchExchange,
  fallbackExchange,
} from 'urql';

createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [debugExchange, cacheExchange, fetchExchange, fallbackExchange],
});
```

## Built in exchanges

### Cache (_default_)

A simple cache which supports caching policies and invalidation of data on mutation execution.

Following caching policies can be specified at query execution:

- `cache-and-network`: Return cached data (if available) and update on completing a network request.
- `cache-only`: Present cached data only.
- `network-only`: Do not use cache.

### Debug

_Intended for development/debugging purposes._

Prints incoming operations and their results to the console.

- If you wish to print every operation, ensure that it is the first in the list of exchanges.

### Dedup (_default_)

Debounces operations which are already in flight.

- Ensure that this is specified before the _Fetch_ exchange.

### Fallback (_default_)

> _Intended for development/debugging purposes._

A stub exchange for catching unhandled operations and printing alerts to the console.

- This exchange should be the last in the list of exchanges.

### Fetch (_default_)

Executes _Query_ and _Mutation_ operations via HTTP to the GraphQL server endpoint.

- HTTP endpoint is passed at client creation and specified using the `url` property.
- Additional fetch parameters can also be passed during client creation using the `fetchOptions` property. For more information about supported fetch options, see type definitions or [MDN web docs](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters).

### Subscription

Executes _Subscription_ operations via a provided websocket adapter.

- Expects to receive an argument with the property `forwardSubscription` being the websocket adapter.
- An [example implementation](https://github.com/FormidableLabs/urql/blob/master/examples/2-using-subscriptions/src/app/index.tsx) can be found in the examples.
