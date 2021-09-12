# With `@defer` / `@stream` Directives

This example shows `urql` in use [with `@defer` and `@stream`
directives](https://graphql.org/blog/2020-12-08-improving-latency-with-defer-and-stream-directives)
in GraphQL.

To run this example install dependencies and run the `start` script:

```sh
yarn install
yarn run start
# or
npm install
npm run start
```

This example contains:

- The `urql` bindings and a React app with a client set up in [`src/App.jsx`](src/App.jsx)
- A local `polka` server set up to test deferred and streamed results in [`server/`](server/).
