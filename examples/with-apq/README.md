# With Automatic Persisted Queries

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

- The `urql` bindings and a React app with a client set up in [`src/App.js`](src/App.js)
- The `persistedFetchExchange` from `@urql/exchange-persisted-fetch` in [`src/App.js`](src/App.js)
- A query for locations in [`src/pages/LocationsList.js`](src/pages/LocationsList.js)
