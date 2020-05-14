<div align="center">
  <img src="../../docs/assets/next-logo.png" alt="NextJS" height="200" width="200">
  <img src="../../packages/site/src/assets/sidebar-badge.svg" alt="urql" height="200" width="200">
  <br />
  <a href="https://npmjs.com/package/next-urql">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/next-urql.svg" />
  </a>
  <a href="https://travis-ci.com/FormidableLabs/next-urql">
    <img alt="Test Status" src="https://api.travis-ci.com/FormidableLabs/next-urql.svg?branch=master" />
  </a>
</div>

## `next-urql`

A set of convenience utilities for using `urql` with NextJS.

### Motivation

Using GraphQL with server-side rendering in React is a challenging problem. Currently, React has no support for `Suspense` for data fetching on the server. To get around this, a prepass step can be used to walk the tree (or a subsection of the tree) of your React application and suspend when it encounters thrown `Promise`s. For more information, check out [`react-ssr-prepass`](https://github.com/FormidableLabs/react-ssr-prepass).

`next-urql` handles integrating this prepass step for you, such that your NextJS application using `urql` will prefetch your GraphQL queries on the server before sending down markup to the Client.

### Installation

Install `next-urql` along with its `peerDependencies`.

```sh
npm install --save next-urql urql react-is isomorphic-unfetch
```

`react-is` helps to support server-side `Suspense` with `react-ssr-prepass`. This assumes you have followed the basic installation steps for `urql` [here](https://github.com/FormidableLabs/urql#installation).

### Usage

To use `next-urql`, first `import` the `withUrqlClient` higher order component.

```javascript
import { withUrqlClient } from 'next-urql';
```

Then, for any page in your `pages` directory for which you want to prefetch GraphQL queries, wrap the page in `withUrqlClient`. For example, let's say you have an `index.js` page that renders two components that make GraphQL requests using `urql`, `PokemonList` and `PokemonTypes`. To run their queries initially on the server-side you'd do something like the following:

```javascript
import React from 'react';
import Head from 'next/head';
import { withUrqlClient } from 'next-urql';

import PokemonList from '../components/pokemon_list';
import PokemonTypes from '../components/pokemon_types';

const Root = () => (
  <div>
    <Head>
      <title>Root</title>
      <link rel="icon" href="/static/favicon.ico" />
    </Head>

    <PokemonList />
    <PokemonTypes />
  </div>
);

export default withUrqlClient({ url: 'https://graphql-pokemon.now.sh' })(Root);
```

Read more below in the [API](#API) section to learn more about the arguments that can be passed to `withUrqlClient`.

#### Integration with `_app.js`

Next allows you to override the root of your application using a special page called [`_app.js`](https://nextjs.org/docs#custom-app). If you want to have all GraphQL requests in your application fetched on the server-side, you _could_ wrap the component exported by `_app.js` in `withUrqlClient`. However, be aware that this will opt you out of [automatic static optimization](https://nextjs.org/docs#automatic-static-optimization) for your entire application. In general, it's recommended practice to only use `withUrqlClient` on the pages that have GraphQL operations in their component tree. Read more in the [Caveats](#Caveats) section. Check out our example for using `next-urql` with `_app.js` [here](./examples/2-with-_app.js/README.md).

### API

`next-urql` exposes a single higher order component, `withUrqlClient`. This HoC accepts two arguments:

#### `clientOptions` (Required)

The `clientOptions` argument is required. It represents all of the options you want to enable on your `urql` Client instance. It has the following union type:

```typescript
type NextUrqlClientConfig =
  | Omit<ClientOptions, 'exchanges' | 'suspense'>
  | ((ctx: NextPageContext) => Omit<ClientOptions, 'exchanges' | 'suspense'>);
```

The `ClientOptions` `interface` comes from `urql` itself and has the following type:

```typescript
interface ClientOptions {
  /** The GraphQL endpoint your application is using. */
  url: string;
  /** Any additional options to pass to fetch. */
  fetchOptions?: RequestInit | (() => RequestInit);
  /** An alternative fetch implementation. */
  fetch?: typeof fetch;
  /** The exchanges used by the Client. See mergeExchanges below for information on modifying exchanges in next-urql. */
  exchanges?: Exchange[];
  /** A flag to enable suspense on the server. next-urql handles this for you. */
  suspense?: boolean;
  /** The default request policy for requests. */
  requestPolicy?: RequestPolicy;
  /** Use HTTP GET for queries. */
  preferGetMethod?: boolean;
  /** Mask __typename from results. */
  maskTypename?: boolean;
}
```

This means you have two options for creating your `urql` Client. The first involves just passing the options as an object directly:

```typescript
withUrqlClient({
  url: 'http://localhost:3000',
  fetchOptions: {
    referrer: 'no-referrer',
    redirect: 'follow',
  },
});
```

The second involves passing a function, which receives Next's context object, `ctx`, as an argument and returns `urql`'s Client options. This is helpful if you need to access some part of Next's context to instantiate your Client options. **Note: `ctx` is _only_ available on the initial server-side render and _not_ on client-side navigation**. This is necessary to allow for different Client configurations between server and client.

```typescript
withUrqlClient(ctx => ({
  url: 'http://localhost:3000',
  fetchOptions: {
    headers: {
      Authorization: ctx
        ? `Bearer ${ctx?.req?.headers?.Authorization ?? ''}`
        : localStorage.getItem('token') ?? '',
    },
  },
}));
```

In client-side SPAs using `urql`, you typically configure the Client yourself and pass it as the `value` prop to `urql`'s context `Provider`. `withUrqlClient` handles setting all of this up for you under the hood. By default, you'll be opted into server-side `Suspense` and have the necessary `exchanges` set up for you, including the [`ssrExchange`](https://formidable.com/open-source/urql/docs/api/#ssrexchange-exchange-factory). If you need to customize your exchanges beyond the defaults `next-urql` provides, use the second argument to `withUrqlClient`, `mergeExchanges`.

#### `mergeExchanges` (Optional)

The `mergeExchanges` argument is optional. This is a function that takes the `ssrExchange` created by `next-urql` as its only argument and allows you to configure your exchanges as you wish. It has the following type signature:

```typescript
(ssrExchange: SSRExchange) => Exchange[]
```

By default, `next-urql` will incorprate the `ssrExchange` into your `exchanges` array in the correct location (after any other caching exchanges, but _before_ the `fetchExchange` – read more [here](https://formidable.com/open-source/urql/docs/basics/#setting-up-the-client)). Use this argument if you want to configure your Client with additional custom `exchanges`, or access the `ssrCache` directly to extract or restore data from its cache.

### Different Client configurations on the client and the server

There are use cases where you may need different configurations for your `urql` Client on the client-side and the server-side; for example, you may want to interact with one GraphQL endpoint on the server-side and another on the client-side. `next-urql` supports this as of v0.3.0. We recommend using `typeof window === 'undefined'` or a `process.browser` check.

```typescript
withUrqlClient({
  url:
    typeof window === 'undefined'
      ? 'https://my-server-graphql-api.com/graphql'
      : 'https://my-client-graphql-api.com/graphql',
});
```

If you want more customization of your Client instance to modify requests on specific routes, for instance, consider using a custom exchange. You can find an example of that [here](/examples/3-with-custom-exchange/README.md).

### Accessing the `urql` Client inside a Page component's `getInitialProps` method

There are use cases where you may want to access the `urql` Client instance inside your Page component's `getInitialProps` method. To support this, we actually attach the `urql` Client instance to the `ctx` object passed to your Page's `getInitialProps` method. You can access it like so:

```typescript
import { NextUrqlPageContext } from 'next-urql';

const Page = () => {
  return <main />;
};

Page.getInitialProps = async (ctx: NextUrqlPageContext) => {
  // Do something with the urql Client instance!
  let client = ctx.urqlClient;

  return {
    ...props,
  };
};
```

### Usage with ReasonML

While there are no official bindings for using `next-urql` with ReasonML, porting `next-urql` to Reason is not too difficult. Moreover, having your own bindings means you can select only the pieces you need from the library. Here's an example of how you could bind `next-urql` if you only needed access to the non-functional `clientOptions` API, and only wanted to pass a `url` and `fetchOptions`. This assumes BuckleScript 7 to take advantage of records compiling into plain JS objects and assumes usage of [`bs-fetch`](https://github.com/reasonml-community/bs-fetch).

```reason
type clientOptions = {
  url: string,
  fetchOptions: Fetch.requestInit
};

[@bs.module "next-urql"]
external withUrqlClient:
  (. clientOptions) =>
  (. React.component('props)) => React.component('props) =
  "withUrqlClient";
```

Which can then be used like so:

```reason
let headers = Fetch.HeadersInit.make({ "Content-Type": "application/json" });
let client = {
  url: "https://mygraphqlapi.com/graphql",
  fetchOptions: Fetch.RequestInit.make(~headers, ~method_=POST, ())
};

[@react.component]
let make = () => {
  <h1>"Heck yeah, next-urql with Reason!"->React.string</h1>
};

let default = (withUrqlClient(. clientOptions))(. make);
```

The great part about writing thin bindings like this is that they are zero cost – in fact, the above bindings get totally compiled away by BuckleScript, so you get the full benefits of type safety with absolutely zero runtime cost!

### Examples

You can see simple example projects using `next-urql` in the `examples` directory or on [CodeSandbox](https://codesandbox.io/s/next-urql-pokedex-oqj3x).

### Caveats

`withUrqlClient` implements Next's unique `getInitialProps` method under the hood. This means that any page containing a component wrapped by `withUrqlClient` will be opted out of [automatic static optimization](https://nextjs.org/docs#automatic-static-optimization). Automatic static optimization was added in Next v9, so you shouldn't worry about this if using an earlier version of Next. This is **not** unique to `next-urql` – any implementation of `getInitialProps` by any component in your application will cause Next to opt out of automatic static optimization.
