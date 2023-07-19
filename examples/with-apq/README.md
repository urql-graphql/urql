# With Automatic Persisted Queries

<p>
  <a href="https://stackblitz.com/github/urql-graphql/urql/tree/main/examples/with-apq">
    <img
      alt="Open in StackBlitz"
      src="https://img.shields.io/badge/open_in_stackblitz-1269D3?logo=stackblitz&style=for-the-badge"
    />
  </a>
  <a href="https://codesandbox.io/p/sandbox/github/urql-graphql/urql/tree/main/examples/with-apq">
    <img
      alt="Open in CodeSandbox"
      src="https://img.shields.io/badge/open_in_codesandbox-151515?logo=codesandbox&style=for-the-badge"
    />
  </a>
</p>

This example shows `urql` in use with `@urql/exchange-persisted-fetch`'s `persistedFetchExchange`
to support [Automatic Persisted
Queries](https://www.apollographql.com/docs/apollo-server/performance/apq/). This largely follows
the ["Persisted Queries" docs
page](https://formidable.com/open-source/urql/docs/advanced/persistence-and-uploads/#automatic-persisted-queries)
and uses the [`trygql.formidable.dev/graphql/apq-weather` schema](https://github.com/FormidableLabs/trygql).

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
- The `persistedFetchExchange` from `@urql/exchange-persisted-fetch` in [`src/App.jsx`](src/App.jsx)
- A query for locations in [`src/LocationsList.jsx`](src/pages/LocationsList.jsx)
