# With Pagination (in React)

<p>
  <a href="https://stackblitz.com/github/urql-graphql/urql/tree/main/examples/with-pagination">
    <img
      alt="Open in StackBlitz"
      src="https://img.shields.io/badge/open_in_stackblitz-1269D3?logo=stackblitz&style=for-the-badge"
    />
  </a>
  <a
  href="https://codesandbox.io/p/sandbox/github/urql-graphql/urql/tree/main/examples/with-pagination">
    <img
      alt="Open in CodeSandbox"
      src="https://img.shields.io/badge/open_in_codesandbox-151515?logo=codesandbox&style=for-the-badge"
    />
  </a>
</p>

This example shows how to implement pagination with `urql` in your React UI code.

It renders several pages as fragments with one component managing the variables
for the page queries. This example is also reapplicable to other libraries,
like Svelte or Vue.

To run this example install dependencies and run the `start` script:

```sh
yarn install
yarn run start
# or
npm install
npm run start
```

This example contains:

- The `urql` bindings and a React app with a client set up in [`src/App.js`](src/App.jsx)
- A managing component called `PaginatedNpmSearch` set up to render all pages in [`src/PaginatedNpmSearch.jss`](src/PaginatedNpmSearch.jsx)
- A page component called `SearchResultPage` running page queries in [`src/PaginatedNpmSearch.jsx`](src/PaginatedNpmSearch.jsx)
