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

This will provide `__URQL_DATA__` globally which we've used in our first example to inject data into
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
rendering](https://reactjs.org/docs/concurrent-mode-suspense.html). However, suspense is currently
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
  ssrExchange
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
`react-ssr-prepass`, which is called `preact-ssr-prepass`. It only has a peer dependency on Preact
and we can install it like so:

```sh
yarn add preact-ssr-prepass preact
# or
npm install --save preact-ssr-prepass preact
```

All above examples for `react-ssr-prepass` will still be the exact same, except that instead of
using the `urql` package we'll have to import from `@urql/preact`, and instead of `react-ssr-prepass`
we'll have to import from. `preact-ssr-prepass`.

## Next.js

If you're using [Next.js](https://nextjs.org/) you can save yourself a lot of work by using
`next-urql`. The `next-urql` package includes setup for `react-ssr-prepass` already, which automates
a lot of the complexity of setting up server-side rendering with `urql`.

We have a custom integration with [`Next.js`](https://nextjs.org/), being [`next-urql`](https://github.com/FormidableLabs/next-urql)
this integration contains convenience methods specifically for `Next.js`.
These will simplify the above setup for SSR.

To setup `next-urql`, first we'll install `next-urql` with `react-is` and `isomorphic-unfetch` as
peer dependencies:

```sh
yarn add next-urql react-is isomorphic-unfetch
# or
npm install --save next-urql react-is isomorphic-unfetch
```

The peer dependency on `react-is` is inherited from `react-ssr-prepass` requiring it, and the peer
dependency on `isomorphic-unfetch` exists, since `next-urql` automatically injects it as a `fetch`
polyfill.

We're now able to wrap any page or `_app.js` using the `withUrqlClient` higher-order component. If
we wrap `_app.js` we won't have to wrap any individual page, but we also won't be able to make use
of Next's ["Automatic Static
Optimization"](https://nextjs.org/docs/advanced-features/automatic-static-optimization).

```js
// pages/index.js
import React from 'react';
import Head from 'next/head';
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

This will automatically set up server-side rendering on the page. The `withUrqlClient` higher-order
component function accepts the usual `Client` options as an argument. This may either just be an
object or a function that receives the Next.js' `getInitialProps` context.

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

### Resetting the client instance

In rare scenario's you possibly will have to reset the client instance (reset all cache, ...), this is an uncommon scenario
and we consider it "unsafe" so evaluate this carefully for yourself.

When this does seem like the appropriate solution any component wrapped with `withUrqlClient` will receive the `resetUrqlClient`
property, when invoked this will create a new top-level client and reset all prior operations.
