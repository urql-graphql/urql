## `next-urql` - Custom Exchange Example

This example is a small reference of how to implement and use a custom exchange in your urql client with `next-urql`. The project is a small Pokedex querying the excellent [Pokemon GraphQL API](https://github.com/lucasbento/graphql-pokemon).

### Installation

To get the example project running, follow these two steps:

```sh
yarn
yarn start
```

The example project should spin up at `http://localhost:3000`. `yarn start` will always run the build of the `next-urql` source, so you should see changes picked up once the dev server boots up. However, if you make changes to the `next-urql` source while the dev server is running, you'll need to run `yarn start` again to see those changes take effect.
