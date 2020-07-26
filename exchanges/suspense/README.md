<h2 align="center">@urql/exchange-suspense <strong>(deprecated)</strong></h2>
<p align="center">
<strong>An exchange for client-side React Suspense support in <code>urql</code></strong>
</p>
<br />

`@urql/exchange-suspense` is an exchange for the [`urql`](../../README.md) GraphQL client that allows the
use of React Suspense on the client-side with `urql`'s built-in suspense mode.

`urql` already supports suspense today, but it's typically used to implement prefetching
during server-side rendering with `react-ssr-prepass`, which allows it to execute React
suspense on the server.
But since `<Suspense>` is mainly intended for client-side use it made sense to build and publish
this exchange, which allows you to try out `urql` and suspense in your React app!

> ⚠️ **\*Deprecated**:
> This package is deprecated! Usage of client-side suspense with `urql` isn't recommended anymore
> and this packages has been marked as _deprecated_ after being _experimental_, since all it allows
> for is to use Suspense as a fancier loading boundary, which isn't its intended use.
> This exchange may still be useful when used with care, but it's worth keeping in mind that the
> suspense patterns in `urql` for the client-side may change.
> Suspense-mode usage for SSR remains unchanged and undeprecated however.

## Quick Start Guide

First install `@urql/exchange-suspense` alongside `urql`:

```sh
yarn add @urql/exchange-suspense
# or
npm install --save @urql/exchange-suspense
```

You'll then need to add the `suspenseExchange`, that this package exposes, to your
`urql` Client and set the `suspense` mode to `true`:

```js
import { createClient, dedupExchange, cacheExchange, fetchExchange } from 'urql';
import { suspenseExchange } from '@urql/exchange-suspense';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  suspense: true, // Enable suspense mode
  exchanges: [
    dedupExchange,
    suspenseExchange, // Add suspenseExchange to your urql exchanges
    cacheExchange,
    fetchExchange,
  ],
});
```

**Important:**
In React Suspense when a piece of data is still loading, a promise will
be thrown that tells React to wait for this promise to complete and try rendering the
suspended component again. The `suspenseExchange` works by caching
the result of any operation until React retries, but it doesn't replace the
`cacheExchange`, since it only briefly keeps the result around.

This means that, in your array of Exchanges, the `suspenseExchange` should be
added _after the `dedupExchange`_ and _before the `cacheExchange`_.

## Usage

After installing `@urql/exchange-suspense` and adding it to your `urql` client,
`urql` will load all your queries in suspense mode. So instead of relying
on the `fetching` flag, you can wrap your components in a `<Suspense>`
element.

```js
import React from 'react';
import { useQuery } from 'urql';

const LoadingIndicator = () => <h1>Loading...</h1>;

const YourContent = () => {
  const [result] = useQuery({ query: allPostsQuery });
  // result.fetching will always be false here, as
  // this component only renders when it has data
  return null; // ...
};

<React.Suspense fallback={<LoadingIndicator />}>
  <YourContent />
</React.Suspense>;
```

Note that in React Suspense, the thrown promises bubble up the component tree until the first `React.Suspense` boundary. This means that the Suspense boundary does not need to be the immediate parent of the component that does the fetching! You should place it in the component hierarchy wherever you want to see the fallback loading indicator, e.g.

```js
<React.Suspense fallback={<LoadingIndicator />}>
  <AnyOtherComponent>
    <AsDeepAsYouWant>
      <YourContent />
    </AsDeepAsYouWant>
  </AnyOtherComponent>
</React.Suspense>
```

[You can also find a fully working demo on CodeSandbox.](https://codesandbox.io/s/urql-client-side-suspense-demo-81obe)

## Caveats

### About server-side usage

The suspense exchange is not intended to work for server-side rendering suspense! This is
what the `ssrExchange` is intended for and it's built into the main `urql` package. The
`suspenseExchange` however is just intended for client-side suspense and use with
`<React.Suspense>`.

The `<React.Suspense>` element currently won't even be rendered during server-side rendering,
and has been disabled in `react-dom/server`. So if you use `suspenseExchange` and
`<React.Suspense>` in your server-side code you may see some unexpected behaviour and
errors.

### Usage with `ssrExchange`

If you're also using the `ssrExchange` for server-side rendered data, you will have to use
an additional flag to indicate to it when it's running on the server-side and when it's running
on the client-side.

By default, the `ssrExchange` will look at `client.suspense`. If the `urql` Client is in suspense
mode then the `ssrExchange` assumes that it's running on the server-side. When it's not
in suspense mode (`!client.suspense`) it assumes that it's running on the client-side.

When you're using `@urql/exchange-suspense` you'll enable the suspense mode on the
client-side as well, which means that you'll have to tell the `ssrExchange` manually
when it's running on the client-side.

Most of the time you can achieve this by checking `process.browser` in any Webpack
environment. The `ssrExchange` accepts an `isClient` flag that you can set to
true on the client-side.

```js
const isClient = !!process.browser;

const client = createClient({
  url: 'http://localhost:1234/graphql',
  suspense: true,
  exchanges: [
    dedupExchange,
    isClient && suspenseExchange,
    ssrExchange({
      initialData: isClient ? window.URQL_DATA : undefined,
      // This will need to be passed explicitly to ssrExchange:
      isClient: !!isClient
    })
    cacheExchange,
    fetchExchange,
  ].filter(Boolean),
});
```
