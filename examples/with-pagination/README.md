# With Pagination (in React)

This example shows how to implement infinite pagination with `urql` in your React UI code. It
renders several pages as fragments with one component managing the variables for the page queries.
This example is also reapplicable to other libraries, like Svelte or Vue.

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
- A managing component called `PaginatedNpmSearch` set up to render all pages in [`src/PaginatedNpmSearch.js`](src/PaginatedNpmSearch.js)
- A page component called `SearchResultPage` running page queries in [`src/PaginatedNpmSearch.js`](src/PaginatedNpmSearch.js)
