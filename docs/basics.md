# Basics

As mentioned before, `urql`'s core logic is split into exchanges.
To that end, `urql`'s behaviour is completely defined by the exchanges
you pass to it or that are the default ones.

This document goes through the exchanges that `urql` adds by default.
When you create a client and pass no `exchanges` array some are added
automatically, which is the same as creating a client using the following
exchanges:

```js
import { Client, dedupExchange, cacheExchange, fetchExchange } from 'urql';

const client = new Client({
  url: '/graphql',
  exchanges: [dedupExchange, cacheExchange, fetchExchange],
});
```

This list of default exchanges is also exported as `defaultExchanges`
however.

## `fetchExchange`

The `fetchExchange` handles `query` and `mutation` operations and uses `fetch`
to send GraphQL API requests.

> _Note:_ Depending on your browser support, you might want to add a fetch
> polyfill to your app.

It also supports cancellation. When an operation becomes "stale", meaning a
component that requested it has unmounted for instance, a `teardown`
operation is sent which can cause `fetch` to abort ongoing requests
when necessary.

Generally there's a couple of things to know about `fetch`.

### Fetch Options

You might have noticed that `fetchOptions` is an option on the
client that can be `RequestInit` or `() => RequestInit`. The
`RequestInit` is just passed on to the `OperationContext`, meaning
that you can also pass it to `executeQuery`.

This is then spread onto the `fetchOptions` that `fetch` will use.
The defaults are as follows.

```js
{
  body: /* ... */,
  headers: { 'Content-Type': 'application/json' },
  method: 'POST',
  signal: /* ... */
}
```

The `signal` is the property that is used for the `abort-controller`.

The `fetchExchange` will also handle `response.status` correctly and
allow `response.status >= 300` when `redirect` is set to `'manual'`.

**In summary:** `fetchExchange` is a simple request handler that takes
operations and sends `POST` requests using `fetch`.

## `cacheExchange`

The default caching behaviour that `urql` uses is defined by the `cacheExchange`
unlike Apollo's `Cache` or `InMemoryCache`, caching behaviour is handled as
part of the request pipeline, which makes customisation a lot easier as
there's no extra API to learn.

By default however, `urql`'s caching behaviour is not that of a _"normalising
cache"_ but more of a _"document cache"_.

### The document cache

When an **operation** is sent it is identifier via its `key` which is a hash
of the `query` and `variables`. A document cache makes the assumption
that there's **no overlap** between any two given queries.

When a query is sent and succeeds, the entire operation result is
cached. This is a simple map of `key` to `OperationResult`.

The **document cache** does not cache by distinct GraphQL types via
`__typename`. Instead it caches whole results.

When a mutation is sent and comes back the document cache invalidates
parts of the cache. It makes the assumption that a mutation's
`__typename` fields indicate that all these types in the cache
are now invalid.

For example, when we fetch a list of `TodoItem`s the response will
contain fields of `__typename: 'TodoItem'`. The document cache
then caches the result and also keeps a map of type names to
operation keys.

When a mutation result comes back that contains `__typename: 'TodoItem'`
as well, the document cache invalidates all previous query results
that also contained these types.

### Limitations

This is a very primitive approach to caching, but works out well
for a lot of content-driven sites.

It might lead to more requests similar to a relatively simple
content app that just sends RESTful requests.

The only assumption that `urql` makes is that your mutations
respond with the types that are invalidated.

Given an `addTodo` mutation for example, you will need to send
back at least one `TodoItem` for the invalidation to happen.

a **document cache** also doesn't normalise at all, which means
that after fetching a list of items, fetching a single item
will never be fulfilled by this cache.

### Request Policies

The operation context can also contain a `requestPolicy` property
that alters when and how the cache responds.
By default this will be set to `'cache-first'`.

When `'cache-first'`, the default behaviour, is used, the cache
will return all cached results when they're available. When no
cached result is available it will let the operation through, so
that the `fetchExchange` can send a request to the API.

When `'cache-only'` is passed, the cache will always return the
cached result or default to `{ data: undefined, error: undefined },
i.e. an empty result, when nothing is cached for a given operation.

For `'network-only'` the opposite of `'cache-only'` is done.
The `cacheExchange` will never return cached results, but will
instead immediately forward the operation to the next exchange,
so that the `fetchExchange` can respond with up-to-date data.
The result will still be cached however.

The last one `'cache-and-network'` is rather special
in that it first does what `'cache-first'` does, it will
return some cached results. After returning a cached result however,
it will forward the operation anyway. This way a temporary cached
result may be displayed that is then updated with fresh data
from the API.

> _Note:_ `'network-only'` and `'cache-and-network'` are extremely valuable
> given the limitations of the default cache. The can be used to ensure
> that data skips the cache, if it's clear to you that the result will
> need to be up-to-date.

### Customisation

The idea of `urql` is that you can customise the caching behaviour amongst
other things yourself, if needed.

[Read more about customising `urql` in the "Extending & Experimenting" section.](extending-and-experimenting.md)

## Subscriptions

One feature of `urql` that was not mentioned in the
["Getting Started" section](getting-started.md) is `urql`'s
APIs and ability to handle subscriptions.

To add support for subscriptions there's the `subscriptionExchange`.
When you first setup subscriptions you will need to add it.

```js
import { Client, defaultExchanges, subscriptionExchange } from 'urql';

const client = new Client({
  url: '/graphql',
  exchanges: [
    ...defaultExchanges,
    subscriptionExchange({
      forwardSubscription,
    }),
  ],
});
```

In the above example, we add the `subscriptionExchange`, which needs
to be called with some additional options, to the client.

The `subscriptionExchange` does not make any assumption over the
transport protocol and scheme that is used. Instead the `forwardSubscription`
function will be called with an enriched operation, which can then be
passed to your subscription client. It expects an "Observable-like"
object to be returned, which needs to follow the
[Observable spec](https://github.com/tc39/proposal-observable).

If you're set up with `apollo-server` or another server that uses
the `subscriptions-transport-ws` package,
[have a look at our subscriptions example project](https://github.com/FormidableLabs/urql/tree/master/examples/2-using-subscriptions).

Once you've set up the `subscriptionExchange` and your
`forwardSubscription` function, you can start using
the `<Subscription>` component and/or the `useSubscription()` hook.

> A tutorial on setting up the `subscriptionExchange` is also available as a
> [screencast on egghead](https://egghead.io/lessons/graphql-set-up-graphql-subscriptions-with-urql?pl=introduction-to-urql-a-react-graphql-client-faaa2bf5).

### Usage with components

The `<Subscription>` component is extremely similar to the `<Query>`
component. You can pass it a query and variables, and it will serve
you render props with `data`, `error`, and `fetching`.

```js
import { Subscription } from 'urql';

const newMessages = `
  subscription MessageSub {
    newMessages {
      id
      from
      message
    }
  }
`;

<Subscription query={newMessages}>
  {({ data }) => /* ... */}
</Subscription>
```

The `data` and `error` of the render props will change every time
a new event is received by the server. When you're accumulating and
collecting events over time, it makes sense to pass this data
into another component and combine it.

### Usage with hooks

The `useSubscription` hooks comes with a similar API to `useQuery`.
It will accept `query` and `variables` as options.

Additionally the second argument for this hook can be a "reducer function".
This function is similar to what you would pass to `Array.prototype.reduce`.

It receives the previous set of data that this function has returned or `undefined`.
As the second argument, it receives the event that has come in from the subscription.
You can use this to accumulate the data over time, which is useful for a
list for example.

In the following example, we create a subscription that informs us of
new messages. We will concatenate the incoming messages, so that we
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

As we can see, the `result.data` is being updated and transformed by
the `handleSubscription` function. This works over time, so as
new messages come in, we will append them to the list of previous
messages.

> A tutorial on the `useSubscription` hook is also available as a
> [screencast on egghead](https://egghead.io/lessons/graphql-write-a-graphql-subscription-with-react-hooks-using-urql?pl=introduction-to-urql-a-react-graphql-client-faaa2bf5).
