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
import { Client, cacheExchange, fetchExchange, ssrExchange } from '@urql/core';

const isServerSide = typeof window === 'undefined';

// The `ssrExchange` must be initialized with `isClient` and `initialState`
const ssr = ssrExchange({
  isClient: !isServerSide,
  initialState: !isServerSide ? window.__URQL_DATA__ : undefined,
});

const client = new Client({
  exchanges: [
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
  Client,
  cacheExchange,
  fetchExchange,
  ssrExchange,
  Provider,
} from 'urql';

const handleRequest = async (req, res) => {
  // ...
  const ssr = ssrExchange({ isClient: false });

  const client new Client({
    url: 'https://??',
    suspense: true, // This activates urql's Suspense mode on the server-side
    exchanges: [cacheExchange, ssr, fetchExchange]
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
`@urql/next`. The `@urql/next` package is set to work with Next 13.

To set up `@urql/next`, first we'll install `@urql/next` and `urql` as
peer dependencies:

```sh
yarn add @urql/next urql graphql
# or
npm install --save @urql/next urql graphql
```

We now have two ways to leverage `@urql/next`, one being part of a Server component
or being part of the general `app/` folder.

In a server component we will import from `@urql/next/rsc`

```ts
// app/page.tsx
import React from 'react';
import Head from 'next/head';
import { cacheExchange, createClient, fetchExchange, gql } from '@urql/core';
import { registerUrql } from '@urql/next/rsc';

const makeClient = () => {
  return createClient({
    url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
    exchanges: [cacheExchange, fetchExchange],
  });
};

const { getClient } = registerUrql(makeClient);

export default async function Home() {
  const result = await getClient().query(PokemonsQuery, {});
  return (
    <main>
      <h1>This is rendered as part of an RSC</h1>
      <ul>
        {result.data.pokemons.map((x: any) => (
          <li key={x.id}>{x.name}</li>
        ))}
      </ul>
    </main>
  );
}
```

When we aren't leveraging server components we will import the things we will
need to do a bit more setup, we go to the `client` component's layout file and
structure it as the following.

```tsx
// app/client/layout.tsx
import { UrqlProvider, ssrExchange, cacheExchange, fetchExchange, createClient } from '@urql/next';

const ssr = ssrExchange();
const client = createClient({
  url: 'https://trygql.formidable.dev/graphql/web-collections',
  exchanges: [cacheExchange, ssr, fetchExchange],
});

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <UrqlProvider client={client} ssr={ssr}>
      {children}
    </UrqlProvider>
  );
}
```

It is important that we pas both a client as well as the `ssrExchange` to the `Provider`
this way we will be able to restore the data that Next streams to the client later on
when we are hydrating.

The next step is to query data in your client components by means of the `useQuery`
method defined in `@urql/next`.

```tsx
// app/client/page.tsx
'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useQuery, gql } from '@urql/next';

export default function Page() {
  return (
    <Suspense>
      <Pokemons />
    </Suspense>
  );
}

const PokemonsQuery = gql`
  query {
    pokemons(limit: 10) {
      id
      name
    }
  }
`;

function Pokemons() {
  const [result] = useQuery({ query: PokemonsQuery });
  return (
    <main>
      <h1>This is rendered as part of SSR</h1>
      <ul>
        {result.data.pokemons.map((x: any) => (
          <li key={x.id}>{x.name}</li>
        ))}
      </ul>
    </main>
  );
}
```

The data queried in the above component will be rendered on the server
and re-hydrated back on the client. When using multiple Suspense boundaries
these will also get flushed as they complete and re-hydrated.

> When data is used throughout the application we advise against
> rendering this as part of a server-component so you can benefit
> from the client-side cache.

### Invalidating data from a server-component

When data is rendered by a server component but you dispatch a mutation
from a client component the server won't automatically know that the
server-component on the client needs refreshing. You can forcefully
tell the server to do so by using the Next router and calling `.refresh()`.

```tsx
import { useRouter } from 'next/router';

const Todo = () => {
  const router = useRouter();
  const executeMutation = async () => {
    await updateTodo();
    router.refresh();
  };
};
```

### Disabling RSC fetch caching

You can pass `fetchOptions: { cache: "no-store" }` to the `createClient`
constructor to avoid running into cached fetches with server-components.

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
