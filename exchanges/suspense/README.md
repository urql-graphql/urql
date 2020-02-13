<h2 align="center">@urql/exchange-suspense</h2>
<p align="center">
<strong>An exchange for client-side React Suspense support in <code>urql</code></strong>
<br /><br />
<a href="https://npmjs.com/package/@urql/exchange-suspense">
  <img alt="NPM Version" src="https://img.shields.io/npm/v/@urql/exchange-suspense.svg" />
</a>
<a href="https://bundlephobia.com/result?p=@urql/exchange-suspense">
  <img alt="Minified gzip size"
  src="https://img.shields.io/bundlephobia/minzip/@urql/exchange-suspense.svg?label=gzip%20size" />
</a>
<a href="https://github.com/FormidableLabs/urql-exchange-suspense#maintenance-status">
  <img alt="Maintenance Status" src="https://img.shields.io/badge/maintenance-experimental-blueviolet.svg" />
</a>
</p>

`@urql/exchange-suspense` is an exchange for the [`urql`](../../README.md) GraphQL client that allows the
use of React Suspense on the client-side with `urql`'s built-in suspense mode.

`urql` already supports suspense today, but it's typically used to implement prefetching
during server-side rendering with `react-ssr-prepass`, which allows it to execute React
suspense on the server.
But since `<Suspense>` is mainly intended for client-side use it made sense to build and publish
this exchange, which allows you to try out `urql` and suspense in your React app!

> ⚠️ Note: React's Suspense feature is currently unstable and may still change.
> This exchange is experimental and demonstrates how `urql` already supports and
> interacts with client-side suspense and how it may behave in the future, when React
> Suspense ships and becomes stable. You may use it, but do so at your own risk!

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
an additonal flag to indicate to it when it's running on the server-side and when it's running
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

## Maintenance Status

**Experimental:** This project is quite new. We're not sure what our ongoing maintenance plan for this project will be. Bug reports, feature requests and pull requests are welcome. If you like this project, let us know by starring the repo!
