## Non-React Usage

While URQL was designed with React in mind, it can be used purely as a functional library.

### Creating a client

To get started, as usual, you will want to create a client.

```jsx
import { createClient, createQuery } from 'urql';

const client = createClient({
  url: 'https://my-host/graphql',
  forwardSubscription(operation, observer) => {
    observer.next({data: {}, error: null, operation}),
    return { unsubscribe };
  },
});
```

### Creating an instance from your client

From here, you'll want to make a new instance from the client you just created. For most simple use-cases, a single instance should be sufficient, however, taking advantage of many instances is useful when executing many different queries.

While you're at it, be sure to pass an _onChange_ function - this will be triggered every time there is a change to the client state (such as new data, the fetching status, errors, etc).

```jsx
let myState = {};

const todoClient = client.createInstance({
  onChange: changed => {
    console.log('The following values changed: ', changed);
    myState = { ...myState, ...changed };
  },
  onSubscriptionUpdate: update => {
    console.log('new data pushed from the server!', update);
    myState = { ...myState, ...update };
  },
});
```

### Executing a query

Now a client instance is configured, it's a good time to try executing a query. Doing so will trigger the earlier provided _onChange_ function with the fetching status as well as the eventual data / error responses.

An additional boolean argument can be provided to notify the _cacheClient_ that we wish to bypass caching.

_It is important to note that, while a query may be executed only once, the onChange function will be called multiple times._

```jsx
const query = createQuery(TodoQuery);

todoClient.executeQuery(query, true);
```

### Executing a mutation

Executing a mutation works in a similar way to executing a query.

In the example below, because we are using the default _cacheExchange_, the _AddTodo_ mutation will cause our previous query to be invalidated and therefore automagically refetched.

```jsx
const mutation = createMutation(AddTodo, args);

todoClient.executeMutation(mutation);
```

### Executing a subscription

Executing a subscription works in a similar way to executing a query.

> Notice! In order to use subscriptions, your client needs to be configured with a `forwardSubscription` option.

```jsx
const subscription = createSubscription(TodoAdded, args);

todoClient.executeSubscription(subscription);
```

**Unsubscribe**

To unsubscribe from a subscription with your backend, pass the same subscription to the unsubscribe function.

```jsx
todoClient.executeUnsubscribeSubscription(subscription);
```

### Terminating the client

Spoiler alert! The magic behind queries being automatically fetched is by-part thanks to the use of streaming. This comes with a catch however as our client instance is now latched onto a stream.

In order to cleanup and prevent memory leaks, you want to ensure that you notify URQL when you are no longer interested in listening for changes by calling the _unsubscribe_ function.

_(For those using react, you don't need to worry about this part as we've got this covered.)_

```jsx
todoClient.unsubscribe();
```
