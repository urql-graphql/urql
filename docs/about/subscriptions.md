## Urql Subscriptions

Urql holds a transport-agnostic opinion and API on subscriptions because the GraphQL spec does not define subscriptions yet. Urql will handle the internal
state and updates, while delegating the actual request operation to a third part (e.g., `subscriptions-transport-ws`).

There are a few steps to make subscriptions work:

1. Create a client with a `forwardSubscription` option.
1. pass subscriptions into a Connect component or HOC configuration.
1. pass an `updateSubscription` method to handle the merging of state.

In more detail:

### Creating a client

To get started, as usual, you will want to create a client but make sure to pass in the `forwardSubscription` handler. It has a method signature of:

```jsx
type forwardSubscription = (
  operation: Operation,
  observer: Observer
) => { unsubscribe: () => void };
```

This works out especially well with Apollo's `subscriptions-transport-ws` as it returns the same unsubscribe shape. Here's an example of it:

```jsx
import { createClient, createQuery } from 'urql';
import { SubscriptionClient } from 'subscriptions-transport-ws';
const subscriptionClient = new SubscriptionClient(
  'ws://localhost:3001/graphql',
  {}
);

const client = createClient({
  url: 'https://my-host/graphql',
  forwardSubscription(operation, observer) => subscribe.request(operation).subscribe({
    next: (data) => observer.next({data, error: null, operation}),
    error: (data) => observer.error({data: null, error, operation}),
  })
});
```

### Component/HOC definitions

Subscriptions are an array for multiple subscriptions a component can listen to. In an example todo app, a subscription for when a todo is added will look like this:

```jsx
import { createSubscription, Connect, ConnectHOC } from 'urql';

const subscriptions = [createSubscription(TodoAdded)];

// <Connect {...subscriptions} />
// or
// ConnectHOC({subscriptions})
```

### updateSubscription handler

When a subscription receives a new event from the server, it is up to the user to manage the merging of old state, with the new change. This handler is attached to the component/HOC and looks like this:

```jsx
<Connect
  subscriptions={[
    createSubscription(TodoAdded),
    createSubscription(TodoRemoved),
  ]}
  updateSubscription={(type, state, data) => {
    if (type === 'todoAdded') {
      state.push(data);
      return state;
    }

    if (type === 'todoRemoved') {
      state.splice(state.indexOf(data), 1);
      return state;
    }
  }}
/>
```
