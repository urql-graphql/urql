# With Vue 3

<p>
  <a href="https://stackblitz.com/github/urql-graphql/urql/tree/main/examples/with-vue3">
    <img
      alt="Open in StackBlitz"
      src="https://img.shields.io/badge/open_in_stackblitz-1269D3?logo=stackblitz&style=for-the-badge"
    />
  </a>
  <a href="https://codesandbox.io/p/sandbox/github/urql-graphql/urql/tree/main/examples/with-vue3">
    <img
      alt="Open in CodeSandbox"
      src="https://img.shields.io/badge/open_in_codesandbox-151515?logo=codesandbox&style=for-the-badge"
    />
  </a>
</p>

This example shows `@urql/vue` in use with Vue 3, as explained on the ["Vue" page of the "Basics"
documentation.](https://formidable.com/open-source/urql/docs/basics/vue/)

To run this example install dependencies and run the `start` script:

```sh
yarn install
yarn run start
# or
npm install
npm run start
```

This example contains:

- The `@urql/vue` bindings with a client set up in [`src/App.vue`](src/App.vue)
- A suspense loading boundary in the `App` component in [`src/App.vue`](src/App.vue)
- A query for pokémon in [`src/PokemonList.vue`](src/pages/PokemonList.vue)
