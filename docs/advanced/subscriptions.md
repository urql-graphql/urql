---
title: Subscriptions
order: 0
---

# Subscriptions

One feature of `urql` that was not mentioned in the ["Basics" sections](../basics/README.md) is `urql`'s
APIs and ability to handle GraphQL subscriptions.

## The Subscription Exchange

To add support for subscriptions we need to add the `subscriptionExchange` to our `Client`.

```js
import { Client, defaultExchanges, subscriptionExchange } from 'urql';

const client = new Client({
  url: 'http://localhost:3000/graphql',
  exchanges: [
    ...defaultExchanges,
    subscriptionExchange({
      forwardSubscription,
    }),
  ],
});
```

Read more about Exchanges and how they work [on the "Authoring Exchanges"
page.](./authoring-exchanges.md) or what they are [on the "Architecture"
page.](../architecture.md)

In the above example, we add the `subscriptionExchange` to the `Client` with the default exchanges
added before it. The `subscriptionExchange` is a factory that accepts additional options and returns
the actual `Exchange` function. It does not make any assumption over the transport protocol and
scheme that is used. Instead, we need to pass a `forwardSubscription` function, which is called with
an "enriched" _Operation_ every time the `Client` attempts to execute a GraphQL Subscription.

When we define this function it must return an "Observable-like" object, which needs to follow the
[Observable spec](https://github.com/tc39/proposal-observable), which comes down to having an
object with a `.subscribe()` method accepting an observer.

## Setting up `graphql-ws`

For backends supporting `graphql-ws`, we recommend using the [graphql-ws](https://github.com/enisdenjo/graphql-ws) client.

```js
import { createClient, defaultExchanges, subscriptionExchange } from 'urql';
import { createClient as createWSClient } from 'graphql-ws';

const wsClient = createWSClient({
  url: 'ws://localhost/graphql',
});

const client = createClient({
  url: '/graphql',
  exchanges: [
    ...defaultExchanges,
    subscriptionExchange({
      forwardSubscription: (operation) => ({
        subscribe: (sink) => ({
          unsubscribe: wsClient.subscribe(operation, sink),
        }),
      }),
    }),
  ],
});
```

In this example, we're creating a `SubscriptionClient`, are passing in a URL and some parameters,
and are using the `SubscriptionClient`'s `request` method to create a Subscription Observable, which
we return to the `subscriptionExchange` inside `forwardSubscription`.

[Read more on the `graphql-ws` README.](https://github.com/enisdenjo/graphql-ws/blob/master/README.md)

## Setting up `subscriptions-transport-ws`

For backends supporting `subscriptions-transport-ws`, [Apollo's `subscriptions-transport-ws`
package](https://github.com/apollographql/subscriptions-transport-ws) can be used.

> The `subscriptions-transport-ws` package isn't actively maintained. If your API supports the new protocol or you can swap the package out, consider using [`graphql-ws`](#setting-up-graphql-ws) instead.

```js
import { Client, defaultExchanges, subscriptionExchange } from 'urql';
import { SubscriptionClient } from 'subscriptions-transport-ws';

const subscriptionClient = new SubscriptionClient('ws://localhost/graphql', { reconnect: true });

const client = new Client({
  url: '/graphql',
  exchanges: [
    ...defaultExchanges,
    subscriptionExchange({
      forwardSubscription: (operation) => subscriptionClient.request(operation)
    }),
  ],
});
```

In this example, we're creating a `SubscriptionClient`, are passing in a URL and some parameters,
and are using the `SubscriptionClient`'s `request` method to create a Subscription Observable, which
we return to the `subscriptionExchange` inside `forwardSubscription`.

[Read more about `subscription-transport-ws` on its README.](https://github.com/apollographql/subscriptions-transport-ws/blob/master/README.md)

## React & Preact

The `useSubscription` hooks comes with a similar API to `useQuery`, which [we've learned about in
the "Queries" page in the "Basics" section.](../basics/react-preact.md#queries)

Its usage is extremely similar in that it accepts options, which may contain `query` and
`variables`. However, it also accepts a second argument, which is a reducer function, similar to
what you would pass to `Array.prototype.reduce`.

It receives the previous set of data that this function has returned or `undefined`.
As the second argument, it receives the event that has come in from the subscription.
You can use this to accumulate the data over time, which is useful for a
list for example.

In the following example, we create a subscription that informs us of
new messages. We will concatenate the incoming messages so that we
can display all messages that have come in over the subscription across
events.

```js
import React from 'react';
import { useSubscription } from 'urql';

const newMessages = `
  subscription MessageSub {
    newMessages {
      id
      from
      text
    }
  }
`;

const handleSubscription = (messages = [], response) => {
  return [response.newMessages, ...messages];
};

const Messages = () => {
  const [res] = useSubscription({ query: newMessages }, handleSubscription);

  if (!res.data) {
    return <p>No new messages</p>;
  }

  return (
    <ul>
      {res.data.map(message => (
        <p key={message.id}>
          {message.from}: "{message.text}"
        </p>
      ))}
    </ul>
  );
};
```

As we can see, the `res.data` is being updated and transformed by
the `handleSubscription` function. This works over time, so as
new messages come in, we will append them to the list of previous
messages.

[Read more about the `useSubscription` API in the API docs for it.](../api/urql.md#usesubscription)

## Svelte

The `subscription` function in `@urql/svelte` comes with a similar API to `query`, which [we've
learned about in the "Queries" page in the "Basics" section.](../basics/svelte.md#queries)

Its usage is extremely similar in that it accepts an `operationStore`, which will typically contain
our GraphQL subscription query. However, `subscription` also accepts a second argument, which is
a reducer function, similar to what you would pass to `Array.prototype.reduce`.

It receives the previous set of data that this function has returned or `undefined`.
As the second argument, it receives the event that has come in from the subscription.
You can use this to accumulate the data over time, which is useful for a
list for example.

In the following example, we create a subscription that informs us of
new messages. We will concatenate the incoming messages so that we
can display all messages that have come in over the subscription across
events.

```js
<script>
  import { operationStore, subscription } from '@urql/svelte';

  const messages = operationStore(`
    subscription MessageSub {
      newMessages {
        id
        from
        text
      }
    }
  `);

  const handleSubscription = (messages = [], data) => {
    return [data.newMessages, ...messages];
  };

  subscription(messages, handleSubscription);
</script>

{#if !$messages.data}
  <p>No new messages</p>
{:else}
  <ul>
    {#each $messages.data as message}
      <li>{message.from}: "{message.text}"</li>
    {/each}
  </ul>
{/if}

```

As we can see, the `$messages.data` is being updated and transformed by the `handleSubscription`
function. This works over time, so as new messages come in, we will append them to
the list of previous messages.

[Read more about the `subscription` API in the API docs for it.](../api/svelte.md#subscription)

## Vue

The `useSubscription` API is very similar to `useQuery`, which [we've learned about in
the "Queries" page in the "Basics" section.](../basics/vue.md#queries)

Its usage is extremely similar in that it accepts options, which may contain `query` and
`variables`. However, it also accepts a second argument, which is a reducer function, similar to
what you would pass to `Array.prototype.reduce`.

It receives the previous set of data that this function has returned or `undefined`.
As the second argument, it receives the event that has come in from the subscription.
You can use this to accumulate the data over time, which is useful for a
list for example.

In the following example, we create a subscription that informs us of
new messages. We will concatenate the incoming messages so that we
can display all messages that have come in over the subscription across
events.

```jsx
<template>
  <div v-if="error">
    Oh no... {{error}}
  </div>
  <div v-else>
    <ul v-if="data">
      <li v-for="msg in data">{{ msg.from }}: "{{ msg.text }}"</li>
    </ul>
  </div>
</template>

<script>
import { useSubscription } from '@urql/vue';

export default {
  setup() {
    const handleSubscription = (messages = [], response) => {
      return [response.newMessages, ...messages];
    };

    const result = useSubscription({
      query: `
        subscription MessageSub {
          newMessages {
            id
            from
            text
          }
        }
      `
    }, handleSubscription)

    return {
      data: result.data,
      error: result.error,
    };
  }
};
</script>
```

As we can see, the `result.data` is being updated and transformed by
the `handleSubscription` function. This works over time, so as
new messages come in, we will append them to the list of previous
messages.

[Read more about the `useSubscription` API in the API docs for it.](../api/vue.md#usesubscription)

## One-off Subscriptions

When you're using subscriptions directly without `urql`'s framework bindings, you can use the
`Client`'s `subscription` method for one-off subscriptions. This method is similar to the ones for
mutations and subscriptions [that we've seen before on the "Core Package" page.](../basics/core.md)

This method will always [returns a Wonka stream](../architecture.md#the-wonka-library) and doesn't
have a `.toPromise()` shortcut method, since promises won't return the multiple values that a
subscription may deliver. Let's convert the above example to one without framework code, as we may
use subscriptions in a Node.js environment.

```js
import { pipe, subscribe } from 'wonka';

const MessageSub = `
  subscription MessageSub {
    newMessages {
      id
      from
      text
    }
  }
`;

const { unsubscribe } = pipe(
  client.subscription(MessageSub),
  subscribe(result => {
    console.log(result); // { data: ... }
  })
);
```
