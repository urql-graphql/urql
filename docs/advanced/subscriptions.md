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
import { Client, cacheExchange, fetchExchange, subscriptionExchange } from 'urql';

const client = new Client({
  url: 'http://localhost:3000/graphql',
  exchanges: [
    cacheExchange,
    fetchExchange,
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
scheme that is used. Instead, we need to pass a `forwardSubscription` function.

The `forwardSubscription` is called when the `subscriptionExchange` receives an `Operation`, so
typically, when you’re executing a GraphQL subscription. This will call the `forwardSubscription`
function with a GraphQL request body, in the same shape that a GraphQL HTTP API may receive it as
JSON input.

If you’re using TypeScript, you may notice that the input that `forwardSubscription` receives has
an optional `query` property. This is because of persisted query support. For some transports, the
`query` property may have to be defaulted to an empty string, which matches the GraphQL over HTTP
specification more closely.

When we define this function it must return an "Observable-like" object, which needs to follow the
[Observable spec](https://github.com/tc39/proposal-observable), which comes down to having an
object with a `.subscribe()` method accepting an observer.

### Setting up `graphql-ws`

For backends supporting `graphql-ws`, we recommend using the [graphql-ws](https://github.com/enisdenjo/graphql-ws) client.

```js
import { Client, cacheExchange, fetchExchange, subscriptionExchange } from 'urql';
import { createClient as createWSClient } from 'graphql-ws';

const wsClient = createWSClient({
  url: 'ws://localhost/graphql',
});

const client = new Client({
  url: '/graphql',
  exchanges: [
    cacheExchange,
    fetchExchange,
    subscriptionExchange({
      forwardSubscription(request) {
        const input = { ...request, query: request.query || '' };
        return {
          subscribe(sink) {
            const unsubscribe = wsClient.subscribe(input, sink);
            return { unsubscribe };
          },
        };
      },
    }),
  ],
});
```

In this example, we're creating a `SubscriptionClient`, are passing in a URL and some parameters,
and are using the `SubscriptionClient`'s `request` method to create a Subscription Observable, which
we return to the `subscriptionExchange` inside `forwardSubscription`.

[Read more on the `graphql-ws` README.](https://github.com/enisdenjo/graphql-ws/blob/master/README.md)

### Setting up `subscriptions-transport-ws`

For backends supporting `subscriptions-transport-ws`, [Apollo's `subscriptions-transport-ws`
package](https://github.com/apollographql/subscriptions-transport-ws) can be used.

> The `subscriptions-transport-ws` package isn't actively maintained. If your API supports the new protocol or you can swap the package out, consider using [`graphql-ws`](#setting-up-graphql-ws) instead.

```js
import { Client, cacheExchange, fetchExchange, subscriptionExchange } from 'urql';
import { SubscriptionClient } from 'subscriptions-transport-ws';

const subscriptionClient = new SubscriptionClient('ws://localhost/graphql', { reconnect: true });

const client = new Client({
  url: '/graphql',
  exchanges: [
    cacheExchange,
    fetchExchange,
    subscriptionExchange({
      forwardSubscription: request => subscriptionClient.request(request),
    }),
  ],
});
```

In this example, we're creating a `SubscriptionClient`, are passing in a URL and some parameters,
and are using the `SubscriptionClient`'s `request` method to create a Subscription Observable, which
we return to the `subscriptionExchange` inside `forwardSubscription`.

[Read more about `subscription-transport-ws` on its README.](https://github.com/apollographql/subscriptions-transport-ws/blob/master/README.md)

### Using `fetch` for subscriptions

Some GraphQL backends (for example GraphQL Yoga) support built-in transport protocols that
can execute subscriptions via a simple HTTP fetch call.
In fact, this is how `@defer` and `@stream` directives are supported. These transports can
also be used for subscriptions.

```js
import { Client, cacheExchange, fetchExchange, subscriptionExchange } from 'urql';

const client = new Client({
  url: '/graphql',
  fetchSubscriptions: true,
  exchanges: [cacheExchange, fetchExchange],
});
```

In this example, we only need to enable `fetchSubscriptions: true` on the `Client`, and the
`fetchExchange` will be used to send subscriptions to the API. If your API supports this transport,
it will stream results back to the `fetchExchange`.

[You can find a code example of subscriptions via `fetch` in an example in the `urql` repository.](https://github.com/urql-graphql/urql/tree/main/examples/with-subscriptions-via-fetch)

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

The `subscriptionStore` function in `@urql/svelte` comes with a similar API to `query`, which [we've
learned about in the "Queries" page in the "Basics" section.](../basics/svelte.md#queries)

Its usage is extremely similar in that it accepts an `operationStore`, which will typically contain
our GraphQL subscription query.

In the following example, we create a subscription that informs us of new messages.

```js
<script>
  import { gql, getContextClient, subscriptionStore } from '@urql/svelte';

  const messages = subscriptionStore({
    client: getContextClient(),
    query: gql`
      subscription MessageSub {
        newMessages {
          id
          from
          text
        }
      }
    `,
  });
</script>

{#if !$messages.data}
  <p>No new messages</p>
{:else}
  <ul>
    {#each $messages.data.newMessages as message}
      <li>{message.from}: "{message.text}"</li>
    {/each}
  </ul>
{/if}

```

As we can see, `$messages.data` is being updated and transformed by the `$messages` subscriptionStore. This works over time, so as new messages come in, we will append them to
the list of previous messages.

`subscriptionStore` optionally accepts a second argument, a handler function, allowing custom update behavior from the subscription.

[Read more about the `subscription` API in the API docs for it.](../api/svelte.md#subscriptionstore)

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
      `,
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
import { gql } from '@urql/core';

const MessageSub = gql`
  subscription MessageSub {
    newMessages {
      id
      from
      text
    }
  }
`;

const { unsubscribe } = client.subscription(MessageSub).subscribe(result => {
  console.log(result); // { data: ... }
});
```
