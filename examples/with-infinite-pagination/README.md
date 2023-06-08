# With Infinite Pagination (in React)

This example shows how to implement **infinite scroll** pagination with `urql`
in your React UI code.

It's slightly different than the [`with-pagination`](../with-pagination) example
and shows how to implement a full infinitely scrolling list with only your UI code,
while fulfilling the following requirements:

- Unlike with [`with-graphcache-pagination`](../with-graphcache-pagination),
  the `urql` cache doesn't have to know about your infinite list, and this works
  with any cache, even the document cache
- Unlike with [`with-pagination`](../with-pagination), your list can use cursors,
  and each page can update, while keeping the variables for the next page dynamic.
- It uses no added state, no extra processing of lists, and you need no effects.

In other words, unless you need a flat array of items
(e.g. unless you’re using React Native’s `FlatList`), this is the simplest way
to implement an infinitely scrolling, paginated list.

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

- The `urql` bindings and a React app with a client set up in [`src/App.js`](src/App.jsx)
  - This also contains a search input which is used as input for the GraphQL queries
- All pagination components are in [`src/SearchResults.jsx`](src/SearchResults.jsx)
  - The `SearchRoot` component loads the first page of results and renders `SearchPage`
  - The `SearchPage` displays cached results, and otherwise only starts a network request on
    a button press
  - The `Package` component is used for each result item
