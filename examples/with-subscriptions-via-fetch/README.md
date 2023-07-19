# With Subscriptions via Fetch

<p>
  <a
  href="https://stackblitz.com/github/urql-graphql/urql/tree/main/examples/with-subscriptions-via-fetch">
    <img
      alt="Open in StackBlitz"
      src="https://img.shields.io/badge/open_in_stackblitz-1269D3?logo=stackblitz&style=for-the-badge"
    />
  </a>
  <a
  href="https://codesandbox.io/p/sandbox/github/urql-graphql/urql/tree/main/examples/with-subscriptions-via-fetch">
    <img
      alt="Open in CodeSandbox"
      src="https://img.shields.io/badge/open_in_codesandbox-151515?logo=codesandbox&style=for-the-badge"
    />
  </a>
</p>

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
