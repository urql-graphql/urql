## `next-urql` - Suspense Exchange Example

This example is a small reference of how to enable suspense browser-side in your urql client with `next-urql`. The project is a small Pokedex querying the excellent [Pokemon GraphQL API](https://github.com/lucasbento/graphql-pokemon).

### Installation

To get the example project running, follow these steps:

1. Install dependencies in the root of the `urql` monorepo:

```sh
# From urql repo root:
yarn
```

2. Build the `core` package in the `urql` monorepo:

```sh
# From urql repo root:
cd packages/core
yarn build
```

3. Build the `react-urql` package in the `urql` monorepo:

```sh
# From urql repo root:
cd packages/react-urql
yarn build
```

4. Navigate to this directory, install dependencies, and start the project:

```sh
# From urql repo root:
cd packages/next-urql/examples/5-with-suspense-exchange
yarn
yarn start
```

The example project should spin up at `http://localhost:3000`. `yarn start` will always run the build of the `next-urql` source, so you should see changes picked up once the dev server boots up. However, if you make changes to the `next-urql` source while the dev server is running, you'll need to run `yarn start` again to see those changes take effect.
