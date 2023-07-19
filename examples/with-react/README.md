# With React

<p>
  <a href="https://stackblitz.com/github/urql-graphql/urql/tree/main/examples/with-react">
    <img
      alt="Open in StackBlitz"
      src="https://img.shields.io/badge/open_in_stackblitz-1269D3?logo=stackblitz&style=for-the-badge"
    />
  </a>
  <a href="https://codesandbox.io/p/sandbox/github/urql-graphql/urql/tree/main/examples/with-react">
    <img
      alt="Open in CodeSandbox"
      src="https://img.shields.io/badge/open_in_codesandbox-151515?logo=codesandbox&style=for-the-badge"
    />
  </a>
</p>

This example shows `urql` in use with React, as explained on the ["React/Preact" page of the "Basics"
documentation.](https://formidable.com/open-source/urql/docs/basics/react-preact/)

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
- A query for pokémon in [`src/PokemonList.jsx`](src/PokemonList.jsx)
