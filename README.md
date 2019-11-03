<div align="center">
  <img src="assets/next_logo.png" alt="NextJS" height="200" width="200">
  <img src="assets/urql_logo.png" alt="urql" height="200" width="200">
  <br />
  <a href="https://npmjs.com/package/next-urql">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/next-urql.svg" />
  </a>
</div>

## `next-urql`

A set of convenience utilities for using `urql` with NextJS.

### Motivation

Using GraphQL with server-side rendering in React is a challenging problem. Currently, React has no support for `Suspense` for data fetching on the server. To get around this, a prepass step can be used to walk the tree (or a subsection of the tree) of your React application and suspend when it encounters thrown `Promise`s. For more information, check out [`react-ssr-prepass`](https://github.com/FormidableLabs/react-ssr-prepass).

`next-urql` handles integrating this prepass step for you, such that your NextJS application using `urql` will prefetch your GraphQL queries on the server before sending down markup to the client.

### Installation

```sh
yarn add next-urql
```

### API

`next-urql` exposes a single higher order component, `withUrqlClient`. This HoC accepts two arguments:

#### `clientOptions` (Required)

The `clientOptions` argument is required. It represents all of the options you want to enable on your `urql` Client instance. It has the following type:

```typescript
export interface ClientOptions {
  /** The GraphQL endpoint your application is using. */
  url: string;
  /** Any additional options to pass to fetch. */
  fetchOptions?: RequestInit | (() => RequestInit);
  /** An alternative fetch implementation. */
  fetch?: typeof fetch;
  /** The default request policy for requests. */
  requestPolicy?: RequestPolicy;
}
```

In client-side SPAs using `urql`, you typically configure the `Client` yourself and pass it as the `value` prop to `urql`'s context `Provider`. `withUrqlClient` handles setting all of this up for you under the hood. By default, you'll be opted into server-side `Suspense` and have the necessary `exchanges` setup for you, including the [`ssrExchange`](https://formidable.com/open-source/urql/docs/api/#ssrexchange-exchange-factory). If you need to customize your exchanges beyond the defaults `next-urql` provides, use the second argument to `withUrqlClient`, `mergeExchanges`.

#### `mergeExchanges` (Optional)

The `mergeExchanges` argument is optional. This is a function that takes the `ssrExchange` created by `next-urql` as its only argument and allows you to configure your exchanges as you wish. It has the following type signature:

```typescript
(ssrExchange: SSRExchange) => Exchange[]
```

By default, `next-urql` will incorprate the `ssrExchange` into your `exchanges` array in the correct location (after any other caching exchanges, but _before_ the `fetchExchange` – read more [here](https://formidable.com/open-source/urql/docs/basics/#setting-up-the-client)). Use this argument if you want to configure your client with additional custom `exchanges`, or access the `ssrCache` directly to extract or restore data from its cache.

### Caveats

`withUrqlClient` implements NextJS's unique `getInitialProps` method uner the hood. This means that any page containing a component wrapped by `withUrqlClient` will be opted out of [automatic static optimization](https://nextjs.org/docs#automatic-static-optimization). Automatic static optimization was added in Next v9, so you shouldn't worry about this if using an earlier version of Next. This is **not** unique to `next-urql` – any implementation of `getInitialProps` by any component in your application will cause Next to opt out of automatic static optimization.
