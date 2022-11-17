---
title: Server-side Rendering
order: 3
---

# Server-side Rendering

In server-side rendered applications we often need to set our application up so that data will be
fetched on the server-side and later sent down to the client for hydration. `urql` supports this
through the `ssrExchange.`

## The SSR Exchange

The `ssrExchange` has two functions. On the server-side it's able to gather all results as they're
being fetched, which can then be serialized and sent to the client. On the client-side it's able to
use these serialized results to rehydrate and render the application without refetching this data.

To start out with the `ssrExchange` we have to add the exchange to our `Client`:

```js
import { createClient, dedupExchange, cacheExchange, fetchExchange, ssrExchange } from '@urql/core';

const isServerSide = typeof window === 'undefined';

// The `ssrExchange` must be initialized with `isClient` and `initialState`
const ssr = ssrExchange({
  isClient: !isServerSide,
  initialState: !isServerSide ? window.__URQL_DATA__ : undefined,
});

const client = createClient({
  exchanges: [
    dedupExchange,
    cacheExchange,
    ssr, // Add `ssr` in front of the `fetchExchange`
    fetchExchange,
  ],
});
```

The `ssrExchange` must be initialized with the `isClient` and `initialState` options. The `isClient`
option tells the exchange whether it's on the server- or client-side. In our example we use `typeof window` to determine this, but in Webpack environments you may also be able to use `process.browser`.

Optionally, we may also choose to enable `staleWhileRevalidate`. When enabled this flag will ensure that although a result may have been rehydrated from our SSR result, another
refetch `network-only` operation will be issued, to update stale data. This is useful for statically generated sites (SSG) that may ship stale data to our application initially.

The `initialState` option should be set to the serialized data you retrieve on your server-side.
This data may be retrieved using methods on `ssrExchange()`. You can retrieve the serialized data
after server-side rendering using `ssr.extractData()`:

```js
// Extract and serialise the data like so from the `ssr` instance
// we've previously created by calling `ssrExchange()`
const data = JSON.stringify(ssr.extractData());

const markup = ''; // The render code for our framework goes here

const html = `
<html>
  <body>
    <div id="root">${markup}</div>
    <script>
      window.__URQL_DATA__ = JSON.parse(${data});
    </script>
  </body>
</html>
`;
```

This will provide `__URQL_DATA__` globally, which we've used in our first example to inject data into
the `ssrExchange` on the client-side.

Alternatively you can also call `restoreData` as long as this call happens synchronously before the
`client` starts receiving queries.

```js
const isServerSide = typeof window === 'undefined';
const ssr = ssrExchange({ isClient: !isServerSide });

if (!isServerSide) {
  ssr.restoreData(window.__URQL_DATA__);
}
```

## Using `react-ssr-prepass`

In the previous examples we've set up the `ssrExchange`, however with React this still requires us
to manually execute our queries before rendering a server-side React app [using `renderToString`
or `renderToNodeStream`](https://reactjs.org/docs/react-dom-server.html#rendertostring).

For React, `urql` has a "Suspense mode" that [allows data fetching to interrupt
rendering](https://reactjs.org/docs/concurrent-mode-suspense.html). However, Suspense is
not supported by React during server-side rendering.

Using [the `react-ssr-prepass` package](https://github.com/FormidableLabs/react-ssr-prepass) however,
we can implement a prerendering step before we let React server-side render, which allows us to
automatically fetch all data that the app requires with Suspense. This technique is commonly
referred to as a "two-pass approach", since our React element is traversed twice.

To set this up, first we'll install `react-ssr-prepass`. It has a peer dependency on `react-is`
and `react`.

```sh
yarn add react-ssr-prepass react-is react-dom
# or
npm install --save react-ssr-prepass react-is react-dom
```

Next, we'll modify our server-side code and add `react-ssr-prepass` in front of `renderToString`.

```jsx
import { renderToString } from 'react-dom/server';
import prepass from 'react-ssr-prepass';

import {
  createClient,
  dedupExchange,
  cacheExchange,
  fetchExchange,
  ssrExchange,
  Provider,
} from 'urql';

const handleRequest = async (req, res) => {
  // ...
  const ssr = ssrExchange({ isClient: false });

  const client createClient({
    suspense: true, // This activates urql's Suspense mode on the server-side
    exchanges: [dedupExchange, cacheExchange, ssr, fetchExchange]
  });

  const element = (
    <Provider value={client}>
      <App />
    </Provider>
  );

  // Using `react-ssr-prepass` this prefetches all data
  await prepass(element);
  // This is the usual React SSR rendering code
  const markup = renderToString(element);
  // Extract the data after prepass and rendering
  const data = JSON.stringify(ssr.extractData());

  res.status(200).send(`
    <html>
      <body>
        <div id="root">${markup}</div>
        <script>
          window.__URQL_DATA__ = JSON.parse(${data});
        </script>
      </body>
    </html>
  `);
};
```

It's important to set enable the `suspense` option on the `Client`, which switches it to support
React suspense.

### With Preact

If you're using Preact instead of React, there's a drop-in replacement package for
`react-ssr-prepass`, which is called `preact-ssr-prepass`. It only has a peer dependency on Preact,
and we can install it like so:

```sh
yarn add preact-ssr-prepass preact
# or
npm install --save preact-ssr-prepass preact
```

All above examples for `react-ssr-prepass` will still be the same, except that instead of
using the `urql` package we'll have to import from `@urql/preact`, and instead of `react-ssr-prepass`
we'll have to import from. `preact-ssr-prepass`.

## Next.js

If you're using [Next.js](https://nextjs.org/) you can save yourself a lot of work by using
`next-urql`. The `next-urql` package includes setup for `react-ssr-prepass` already, which automates
a lot of the complexity of setting up server-side rendering with `urql`.

We have a custom integration with [`Next.js`](https://nextjs.org/), being [`next-urql`](https://github.com/urql-graphql/urql/tree/main/packages/next-urql)
this integration contains convenience methods specifically for `Next.js`.
These will simplify the above setup for SSR.

To set up `next-urql`, first we'll install `next-urql` with `react-is` and `urql` as
peer dependencies:

```sh
yarn add next-urql react-is urql graphql
# or
npm install --save next-urql react-is urql graphql
```

The peer dependency on `react-is` is inherited from `react-ssr-prepass` requiring it.

Note that if you are using Next before v9.4 you'll need to polyfill fetch, this can be
done through [`isomorphic-unfetch`](https://www.npmjs.com/package/isomorphic-unfetch).

We're now able to wrap any page or `_app.js` using the `withUrqlClient` higher-order component. If
we wrap `_app.js` we won't have to wrap any individual page.

```js
// pages/index.js
import React from 'react';
import Head from 'next/head';
import { useQuery } from 'urql';
import { withUrqlClient } from 'next-urql';

const Index = () => {
  const [result] = useQuery({
    query: '{ test }',
  });

  // ...
};

export default withUrqlClient((_ssrExchange, ctx) => ({
  // ...add your Client options here
  url: 'http://localhost:3000/graphql',
}))(Index);
```

The `withUrqlClient` higher-order component function accepts the usual `Client` options as
an argument. This may either just be an object, or a function that receives the Next.js'
`getInitialProps` context.

One added caveat is that these options may not include the `exchanges` option because `next-urql`
injects the `ssrExchange` automatically at the right location. If you're setting up custom exchanges
you'll need to instead provide them in the `exchanges` property of the returned client object.

```js
import { dedupExchange, cacheExchange, fetchExchange } from '@urql/core';

import { withUrqlClient } from 'next-urql';

export default withUrqlClient(ssrExchange => ({
  url: 'http://localhost:3000/graphql',
  exchanges: [dedupExchange, cacheExchange, ssrExchange, fetchExchange],
}))(Index);
```

Unless the component that is being wrapped already has a `getInitialProps` method, `next-urql` won't add its own SSR logic, which automatically fetches queries during
server-side rendering. This can be explicitly enabled by passing the `{ ssr: true }` option as a second argument to `withUrqlClient`.

When you are using `getStaticProps`, `getServerSideProps`, or `getStaticPaths`, you should opt-out of `Suspense` by setting the `neverSuspend` option to `true` in your `withUrqlClient` configuration.
During the prepass of your component tree `next-urql` can't know how these functions will alter the props passed to your page component. This injection
could change the `variables` used in your `useQuery`. This will lead to error being thrown during the subsequent `toString` pass, which isn't supported in React 16.

### SSR with { ssr: true }

The `withUrqlClient` only wraps our component tree with the context provider by default.
To enable SSR, the easiest way is specifying the `{ ssr: true }` option as a second
argument to `withUrqlClient`:

```js
import { dedupExchange, cacheExchange, fetchExchange } from '@urql/core';

import { withUrqlClient } from 'next-urql';

export default withUrqlClient(
  ssrExchange => ({
    url: 'http://localhost:3000/graphql',
    exchanges: [dedupExchange, cacheExchange, ssrExchange, fetchExchange],
  }),
  { ssr: true } // Enables server-side rendering using `getInitialProps`
)(Index);
```

Be aware that wrapping the `_app` component using `withUrqlClient` with the `{ ssr: true }`
option disables Next's ["Automatic Static
Optimization"](https://nextjs.org/docs/advanced-features/automatic-static-optimization) for
**all our pages**. It is thus preferred to enable server-side rendering on a per-page basis.

### SSR with getStaticProps or getServerSideProps

Enabling server-side rendering using `getStaticProps` and `getServerSideProps` is a little
more involved, but has two major benefits:

1. allows **direct schema execution** for performance optimisation
2. allows performing extra operations in those functions

To make the functions work with the `withUrqlClient` wrapper, return the `urqlState` prop
with the extracted data from the `ssrExchange`:

```js
import { withUrqlClient, initUrqlClient } from 'next-urql';
import { ssrExchange, dedupExchange, cacheExchange, fetchExchange, useQuery } from 'urql';

const TODOS_QUERY = `
  query { todos { id text } }
`;

function Todos() {
  const [res] = useQuery({ query: TODOS_QUERY });
  return (
    <div>
      {res.data.todos.map(todo => (
        <div key={todo.id}>
          {todo.id} - {todo.text}
        </div>
      ))}
    </div>
  );
}

export async function getStaticProps(ctx) {
  const ssrCache = ssrExchange({ isClient: false });
  const client = initUrqlClient(
    {
      url: 'your-url',
      exchanges: [dedupExchange, cacheExchange, ssrCache, fetchExchange],
    },
    false
  );

  // This query is used to populate the cache for the query
  // used on this page.
  await client.query(TODOS_QUERY).toPromise();

  return {
    props: {
      // urqlState is a keyword here so withUrqlClient can pick it up.
      urqlState: ssrCache.extractData(),
    },
    revalidate: 600,
  };
}

export default withUrqlClient(
  ssr => ({
    url: 'your-url',
  })
  // Cannot specify { ssr: true } here so we don't wrap our component in getInitialProps
)(Todos);
```

The above example will make sure the page is rendered as a static-page, It's important that
you fully pre-populate your cache so in our case we were only interested in getting our todos,
if there are child components relying on data you'll have to make sure these are fetched as well.

The `getServerSideProps` and `getStaticProps` functions only run on the **server-side** — any
code used in them is automatically stripped away from the client-side bundle using the
[next-code-elimination tool](https://next-code-elimination.vercel.app/). This allows **executing
our schema directly** using `@urql/exchange-execute` if we have access to our GraphQL server:

```js
import { withUrqlClient, initUrqlClient } from 'next-urql';
import { ssrExchange, dedupExchange, cacheExchange, fetchExchange, useQuery } from 'urql';
import { executeExchange } from '@urql/exchange-execute';

import { schema } from '@/server/graphql'; // our GraphQL server's executable schema

const TODOS_QUERY = `
  query { todos { id text } }
`;

function Todos() {
  const [res] = useQuery({ query: TODOS_QUERY });
  return (
    <div>
      {res.data.todos.map(todo => (
        <div key={todo.id}>
          {todo.id} - {todo.text}
        </div>
      ))}
    </div>
  );
}

export async function getServerSideProps(ctx) {
  const ssrCache = ssrExchange({ isClient: false });
  const client = initUrqlClient(
    {
      url: '', // not needed without `fetchExchange`
      exchanges: [
        dedupExchange,
        cacheExchange,
        ssrCache,
        executeExchange({ schema }), // replaces `fetchExchange`
      ],
    },
    false
  );

  await client.query(TODOS_QUERY).toPromise();

  return {
    props: {
      urqlState: ssrCache.extractData(),
    },
  };
}

export default withUrqlClient(ssr => ({
  url: 'your-url',
}))(Todos);
```

Direct schema execution skips one network round trip by accessing your resolvers directly
instead of performing a `fetch` API call.

### Stale While Revalidate

If we choose to use Next's static site generation (SSG or ISG) we may be embedding data in our initial payload that's stale on the client. In this case, we may want to update this data immediately after rehydration.
We can pass `staleWhileRevalidate: true` to `withUrqlClient`'s second option argument to Switch it to a mode where it'll refresh its rehydrated data immediately by issuing another network request.

```js
export default withUrqlClient(
  ssr => ({
    url: 'your-url',
  }),
  { staleWhileRevalidate: true }
)(...);
```

Now, although on rehydration we'll receive the stale data from our `ssrExchange` first, it'll also immediately issue another `network-only` operation to update the data.
During this revalidation our stale results will be marked using `result.stale`. While this is similar to what we see with `cache-and-network` without server-side rendering, it isn't quite the same. Changing the request policy wouldn't actually refetch our data on rehydration as the `ssrExchange` is simply a replacement of a full network request. Hence, this flag allows us to treat this case separately.

### Resetting the client instance

In rare scenario's you possibly will have to reset the client instance (reset all cache, ...), this
is an uncommon scenario, and we consider it "unsafe" so evaluate this carefully for yourself.

When this does seem like the appropriate solution any component wrapped with `withUrqlClient` will receive the `resetUrqlClient`
property, when invoked this will create a new top-level client and reset all prior operations.

## Vue Suspense

In Vue 3 a [new feature was introduced](https://vuedose.tips/go-async-in-vue-3-with-suspense/) that
natively allows components to suspend while data is loading, which works universally on the server
and on the client, where a replacement loading template is rendered on a parent while data is
loading.

We've previously seen how we can change our usage of `useQuery`'s `PromiseLike` result to [make use
of Vue Suspense on the "Queries" page.](../basics/vue.md#vue-suspense)

Any component's `setup()` function can be updated to instead be an `async setup()` function, in
other words, to return a `Promise` instead of directly returning its data. This means that we can
update any `setup()` function to make use of Suspense.

On the server-side we can then use `@vue/server-renderer`'s `renderToString`, which will return a
`Promise` that resolves when all suspense-related loading is completed.

```jsx
import { createSSRApp } = from 'vue'
import { renderToString } from '@vue/server-renderer';

import urql, {
  createClient,
  dedupExchange,
  cacheExchange,
  fetchExchange,
  ssrExchange
} from '@urql/vue';

const handleRequest = async (req, res) => {
  // This is where we'll put our root component
  const app = createSSRApp(Root)

  // NOTE: All we care about here is that the SSR Exchange is included
  const ssr = ssrExchange({ isClient: false });
  app.use(urql, {
    exchanges: [dedupExchange, cacheExchange, ssr, fetchExchange]
  });

  const markup = await renderToString(app);

  const data = JSON.stringify(ssr.extractData());

  res.status(200).send(`
    <html>
      <body>
        <div id="root">${markup}</div>
        <script>
          window.__URQL_DATA__ = JSON.parse(${data});
        </script>
      </body>
    </html>
  `);
};
```

This effectively renders our Vue app on the server-side and provides the client-side data for
rehydration that we've set up in the above [SSR Exchange section](#the-ssr-exchange) to use.
