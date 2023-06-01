# With Subscriptions via Fetch

This example shows `urql` in use with subscriptions running via a plain `fetch`
HTTP request to GraphQL Yoga. This uses the [GraphQL Server-Sent
Events](https://the-guild.dev/blog/graphql-over-sse) protocol, which means that
the request streams in more results via a single HTTP response.

This example also includes Graphcache ["Cache
Updates"](https://formidable.com/open-source/urql/docs/graphcache/cache-updates/)
to update a list with incoming items from the subscriptions.

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
- A local `graphql-yoga` server set up to test subscriptions in [`server/`](server/).
