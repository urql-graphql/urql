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
yarn add next-urql react-is urql
# or
npm install --save next-urql react-is urql
```

`react-is` helps to support server-side `Suspense` with `react-ssr-prepass`. This assumes you have followed the basic installation steps for `urql` [here](https://github.com/FormidableLabs/urql#installation).

Note that if you are using Next before v9.4 you'll need to polyfill fetch, this can be
done through [`isomorphic-unfetch`](https://www.npmjs.com/package/isomorphic-unfetch).

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

export default withUrqlClient(() => ({ url: 'https://graphql-pokemon.now.sh' }))(Root);
```

Read more below in the [API](#API) section to learn more about the arguments that can be passed to `withUrqlClient`.

#### Integration with `_app.js`

Next allows you to override the root of your application using a special page called [`_app.js`](https://nextjs.org/docs#custom-app). If you want to have all GraphQL requests in your application fetched on the server-side, you _could_ wrap the component exported by `_app.js` in `withUrqlClient`. However, be aware that this will opt you out of [automatic static optimization](https://nextjs.org/docs#automatic-static-optimization) for your entire application. In general, it's recommended practice to only use `withUrqlClient` on the pages that have GraphQL operations in their component tree. Read more in the [Caveats](#Caveats) section. Check out our example for using `next-urql` with `_app.js` [here](./examples/2-with-_app.js/README.md).

### API

`next-urql` exposes a single higher order component, `withUrqlClient`. This HoC accepts two arguments:

#### `clientOptions` (Required)

The `clientOptions` argument is required. It represents all of the options you want to enable on your `urql` Client instance. It has the following union type:

```typescript
type NextUrqlClientConfig = (ssrExchange: SSRExchange, ctx?: PartialNextContext) => ClientOptions;
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
  /** The exchanges used by the Client. */
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

You can create a client by passing a function which receives the `ssrExchange` and Next's context object, `ctx`, as arguments and returns `urql`'s Client options. This is helpful if you need to access some part of Next's context to instantiate your Client options. **Note: `ctx` is _only_ available on the initial server-side render and _not_ on client-side navigation**. This is necessary to allow for different Client configurations between server and client.

```typescript
withUrqlClient((_ssrExchange, ctx) => ({
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

In client-side SPAs using `urql`, you typically configure the Client yourself and pass it as the `value` prop to `urql`'s context `Provider`. `withUrqlClient` handles setting all of this up for you under the hood. By default, you'll be opted into server-side `Suspense` and have the necessary `exchanges` set up for you, including the [`ssrExchange`](https://formidable.com/open-source/urql/docs/api/#ssrexchange-exchange-factory).

### Resetting the client instance

In rare scenario's you possibly will have to reset the client instance (reset all cache, ...), this is an uncommon scenario
and we consider it "unsafe" so evaluate this carefully for yourself.

When this does seem like the appropriate solution any component wrapped with `withUrqlClient` will receive the `resetUrqlClient`
property, when invoked this will create a new top-level client and reset all prior operations.

#### `exchanges`

When you're using `withUrqlClient` and you don't return an `exchanges` property we'll assume you wanted the default exchanges, these contain: `dedupExchange`, `cacheExchange`, `ssrExchange` (the one you received as a first argument) and the `fetchExchange`.

When you yourself want to pass exchanges don't forget to include the `ssrExchange` you received as the first argument.

#### `withUrqlClientOptions`

The second argument for `withUrqlClient` is an options object, this contains one `boolean` property named `ssr`, you can use this to tell
`withUrqlClient` that the wrapped component does not use `getInitialProps` but the children of this wrapped component do. This opts you into
`ssr` for these children.

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

### Restricting Data Fetching to the Server

If you want to use a `Client` in Next.js' newer methods like `getServerSideProps` you may use the `initUrqlClient` function to create a client on the fly. This will need to be done per request.

```
import { initUrqlClient, NextUrqlPageContext } from 'next-urql';

export const getServerSideProps = async (ctx) => {
  const client = initUrqlClient({
    url: /graphql',
  }, false /* set to false to disable suspense */);

  const result = await client.query(QUERY, {}).toPromise();

  return {
    props: { data: result.data }
  };
};
```

The first argument passed to the `initUrqlClient` function is the same object that we'd normally pass to `createClient`.
The second argument is a `boolean` flag indicating whether or not to enable `suspense`; typically, we'd disable it for manual usage.

### Examples

You can see simple example projects using `next-urql` in the `examples` directory or on [CodeSandbox](https://codesandbox.io/s/next-urql-pokedex-oqj3x).

### Caveats

Using `withUrqlClient` on a page that has `getInitialProps` will opt that component and it's children into a prepass that does a first pass of all queries, when that
component has children using `getInitialProps` but that component itself is not and you want to opt in to this behavior you'll have to set the second argument of
`withUrqlClient`, this means `withUrqlClient(() => clientOptiosn, { ssr:true })`.
This measure is available so we can support `getStaticProps`, ...

When you are using `getStaticProps`, `getServerSideProps`, or `getStaticPaths`, you should opt-out of `Suspense` by setting the `neverSuspend` option to `true` in your `withUrqlClient` configuration.
your `withUrqlClient`.
During the prepass of your component tree `next-urql` can't know how these functions will alter the props passed to your page component. This injection
could change the `variables` used in your `useQuery`. This will lead to error being thrown during the subsequent `toString` pass, which isn't supported in React 16.
