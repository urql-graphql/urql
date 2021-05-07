# With Vue 3

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
