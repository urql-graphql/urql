# With Svelte

<p>
  <a href="https://stackblitz.com/github/urql-graphql/urql/tree/main/examples/with-svelte">
    <img
      alt="Open in StackBlitz"
      src="https://img.shields.io/badge/open_in_stackblitz-1269D3?logo=stackblitz&style=for-the-badge"
    />
  </a>
  <a href="https://codesandbox.io/p/sandbox/github/urql-graphql/urql/tree/main/examples/with-svelte">
    <img
      alt="Open in CodeSandbox"
      src="https://img.shields.io/badge/open_in_codesandbox-151515?logo=codesandbox&style=for-the-badge"
    />
  </a>
</p>

This example shows `@urql/svelte` in use with Svelte, as explained on the ["Svelte" page of the "Basics"
documentation.](https://formidable.com/open-source/urql/docs/basics/svelte/)

To run this example install dependencies and run the `start` script:

```sh
yarn install
yarn run start
# or
npm install
npm run start
```

This example contains:

- The `@urql/svelte` bindings with a client set up in [`src/App.svelte`](src/App.svelte)
- A query for pokémon in [`src/PokemonList.svelte`](src/pages/PokemonList.svelte)
