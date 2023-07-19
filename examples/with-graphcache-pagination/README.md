# With Graphcache's Pagination

<p>
  <a
  href="https://stackblitz.com/github/urql-graphql/urql/tree/main/examples/with-graphcache-pagination">
    <img
      alt="Open in StackBlitz"
      src="https://img.shields.io/badge/open_in_stackblitz-1269D3?logo=stackblitz&style=for-the-badge"
    />
  </a>
  <a
  href="https://codesandbox.io/p/sandbox/github/urql-graphql/urql/tree/main/examples/with-graphcache-pagination">
    <img
      alt="Open in CodeSandbox"
      src="https://img.shields.io/badge/open_in_codesandbox-151515?logo=codesandbox&style=for-the-badge"
    />
  </a>
</p>

This example shows `urql` in use with `@urql/exchange-graphcache`'s infinite pagination helpers to
merge several pages of a Relay-compliant schema into an infinite list.
This largely follows the ["Pagination" section on the "Local Resolvers" docs
page](https://formidable.com/open-source/urql/docs/graphcache/local-resolvers/#pagination)
and uses the [`trygql.formidable.dev/graphql/relay-npm` schema](https://github.com/FormidableLabs/trygql).

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
- The `cacheExchange` from `@urql/exchange-graphcache` in [`src/App.js`](src/App.js)
- A paginated query for packages in [`src/pages/PaginatedNpmSearch.js`](src/pages/PaginatedNpmSearch.js)
