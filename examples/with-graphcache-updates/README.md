# With Graphcache's Pagination

This example shows `urql` in use with `@urql/exchange-graphcache` and demonstrates a manual cache
update, as explained in [the "Cache Updates" docs page](https://formidable.com/open-source/urql/docs/graphcache/cache-updates/).
This example uses the [`trygql.formidable.dev/graphql/web-collections`
schema](https://github.com/FormidableLabs/trygql) and builds on top of the [`with-refresh-auth`
example](../with-refresh-auth) so that we can authenticate with the schema before creating links on
it.

To run this example install dependencies and run the `start` script:

```sh
yarn install
yarn run start
# or
npm install
npm run start
```

This example contains:

- The `urql` bindings and a React app with a client set up in [`src/client.js`](src/client.js)
- The `cacheExchange` from `@urql/exchange-graphcache` in [`src/client.js`](src/client.js)
- A links list and link creation in [`src/pages/Links.jsx`](src/pages/Links.jsx)
