<div align="center">
  <img src="assets/next_logo.png" alt="NextJS" height="200" width="200">
  <img src="assets/urql_logo.png" alt="urql" height="200" width="200">
  <br />
  <h3><code>next-urql</code></h3>
</div>

## `next-urql`

A set of convenience utilities for using `urql` with NextJS.

### Motivation

Using GraphQL with server-side rendering in React is a challenging problem. Currently, React has no support for `Suspense` for data fetching on the server. To get around this, a prepass step can be used to walk the tree (or a subsection of the tree) of your React application and suspend when it encounters thrown `Promise`s. For more information, check out [`react-ssr-prepass`](https://github.com/FormidableLabs/react-ssr-prepass).

`next-urql` handles integrating this prepass step for you, such that your NextJS application using `urql` will prefetch your GraphQL queries on the server before sending down markup to the client.

### API

#### `withUrql`

`withUrql` is a simple higher order component (HoC) that integrates `react-ssr-prepass` and sets up your `urql` client for the server.
