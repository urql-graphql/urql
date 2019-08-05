# Basics

As mentioned before, `urql`'s core logic is split into exchanges.
To that end, `urql`'s behavior is completely defined by the exchanges
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

The default caching behavior that `urql` uses is defined by the `cacheExchange`
unlike Apollo's `Cache` or `InMemoryCache`, caching behavior is handled as
part of the request pipeline, which makes customization a lot easier as
there's no extra API to learn.

By default however, `urql`'s caching behavior is not that of a _"normalizing
cache"_ but more of a _"document cache"_.

### The document cache

When an **operation** is sent it is identified by its `key` which is a hash
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

A **document cache** also doesn't normalise at all, which means
that after fetching a list of items, fetching a single item
will never be fulfilled by this cache.

### Request Policies

The operation context can also contain a `requestPolicy` property
that alters when and how the cache responds.
By default this will be set to `'cache-first'`.

When `'cache-first'`, the default behavior, is used, the cache
will return all cached results when they're available. When no
cached result is available it will let the operation through, so
that the `fetchExchange` can send a request to the API.

When `'cache-only'` is passed, the cache will always return the
cached result or default to `{ data: undefined, error: undefined }`,
i.e. an empty result, when nothing is cached for a given operation.

For `'network-only'` the opposite of `'cache-only'` is done.
The `cacheExchange` will never return cached results, but will
instead immediately forward the operation to the next exchange,
so that the `fetchExchange` can respond with up-to-date data.
The result will still be cached however.

The last one `'cache-and-network'` is rather special
in that it first does what `'cache-first'` does: it will
return some cached results. After returning a cached result however,
it will forward the operation anyway. This way a temporary cached
result may be displayed that is then updated with fresh data
from the API.

> _Note:_ `'network-only'` and `'cache-and-network'` are extremely valuable
> given the limitations of the default cache. The can be used to ensure
> that data skips the cache, if it's clear to you that the result will
> need to be up-to-date.

### Customization

The idea of `urql` is that you can customise the caching behavior amongst
other things yourself, if needed.

[Read more about customising `urql` in the "Extending & Experimenting" section.](extending-and-experimenting.md)

## Server-side rendering

Server-side rendering is a common method to reduce the time it takes for
a user to see a React page's content. Typically this is implemented using
the [`react-dom/server` package](https://reactjs.org/docs/react-dom-server.html).

`urql` can be set up to fetch data on the server and rehydrate this data
on the client, so that the user's browser does not need to refetch it and
can seamlessly rehydrate your React page.

There are two parts in `urql` that enable server-side rendering:

- The `Client` has a `suspense` option, which enables support for React's
  experimental Suspense API for data fetching, which allows us to prefetch
  data before calling `renderToString` or `renderToNodeStream`.
- The `ssrExchange`, which is a small operation cache that works together
  with Suspense to save data on the server and rehydrate it on the client.

Since Suspense is still an experimental API there's no official way to use
it to prefetch data on the server-side. For this reason we have a companion
library, [`react-ssr-prepass`](https://github.com/FormidableLabs/react-ssr-prepass), which can be used to run a "prepass"
that fetches all suspended data it finds in a React element tree.

### Setting up the `Client`

When you set up the `Client` for server-side rendering, on the server
you will need to set `suspense` to `true` and on the client to `false`,

```js
import { Client } from 'urql';

const client = new Client({
  suspense: !process.browser,
  // ...
});
```

You can often achieve this with `process.browser` in most environments if
you're using a single universal file to create a client on the server
and on the client.

Next up, the `ssrExchange` needs to be set up. It's a factory, since
it has some methods for extracting and rehydrating data.

```js
import {
  Client,
  dedupExchange,
  cacheExchange,
  fetchExchange,
  ssrExchange,
} from 'urql';

const ssrCache = ssrExchange();

const client = new Client({
  exchanges: [
    dedupExchange,
    cacheExchange,
    // Put the exchange returned by calling ssrExchange after your cacheExchange,
    // but before any asynchronous exchanges like the fetchExchange:
    ssrCache,
    fetchExchange,
  ],
  // ...
  suspense: !process.browser,
});
```

The exchange returned by `ssrExchange()` should be added after the `cacheExchange`
(or any other custom cache exchange you've defined), and before any
asynchronous exchanges like the `fetchExchange`.

If you're also using suspense mode on the client, you can
additionally set the `isClient` option, which tells the `ssrExchange` manually
whether it's on the server or client, so that you can enable the `suspense`
mode on the client-side as well.

```js
const ssrCache = ssrExchange({ isClient: !!process.browser });
```

### Prefetching on the server

In your request handler on the server-side, you'll have to add some
code for handling suspense. Typically this is done using a "prepass" that
walks your element tree and awaits suspended promises.

In order to execute suspense on the server, you may install
[`react-ssr-prepass`](https://github.com/FormidableLabs/react-ssr-prepass), which is a partial server-side rendering library,
that can be used to execute a prepass on a React element tree.
It supports React's experimental Suspense API and awaits thrown
promises during the server-side prepass, which we'll use to prefetch
all queries in your React app.

```sh
# react-is is a peer dependency of react-ssr-prepass
yarn add react-ssr-prepass react-is
# or
npm install --save react-ssr-prepass react-is
```

Add `react-ssr-prepass` to your server-side rendering code _before_
calling `renderToString` or `renderToNodeStream`. This will fetch
all suspended promises, including `urql`'s queries. And after
you can use the `ssrExchange()`'s `extractData` method to
get `urql`'s data:

```js
import ssrPrepass from 'react-ssr-prepass';

const handler = (req, res) => {
  // ...
  // We assume you've already set up the urql Client and have
  // the `ssrCache = ssrExchange()` variable from somewhere

  await ssrPrepass(<App />);

  // Extract the data from urql's SSR cache
  const urqlData = ssrCache.extractData();

  // Then you can run your rendering code for which the ssrCache
  // should remain unchanged
  const reactHtml = renderToString(<App />);

  // Make sure to send urql's data down to the client somehow
  const urqlHtml = `<script>window.URQL_DATA = ${JSON.stringify(urqlData)};</script>`;

  // And send everything down to the client
  // ...
};
```

### Rehydrating on the client

Now you have server-side rendered the page and sent down data
collected during the render pass. As a next step, you should
rehydrate the data on the client-side.

This is necessary since the same data needs to be available
during React's rehydration so that the client-side renders the
exact same data and UI state.

You can either do so when creating `ssrExchange`, by passing it `initialState`
as a parameter or calling `restoreData` on it:

```js
import { ssrExchange } from 'urql';

const ssrCache = ssrExchange({
  initialState: window.URQL_DATA,
});

// or:

ssrCache.restoreData(window.URQL_DATA);

// Assuming this follows the client setup and is added to the `exchanges` list
// ...
```

Your setup may vary depending on whether your client initialization code
is universal (single file that executes on client and server-side, such as Next.js'
`async getInitialProps`), or two separate files for client and server.

If you're using [next.js](https://nextjs.org/) or need some more details on how to set this
up [have a look at our SSR + next.js example project](https://github.com/FormidableLabs/urql/tree/master/examples/3-ssr-with-nextjs).

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
you render props with `data`, `error`, `extensions`, and `fetching`.

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
