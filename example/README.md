## `next-urql` Example

This example is a small reference of how to integrate `next-urql` with your NextJS application. The project is a small Pokedex querying the excellent [Pokemon GraphQL API](https://github.com/lucasbento/graphql-pokemon).

### Installation

To get the example project running, follow these two steps:

```sh
bash install_deps.sh
yarn dev
```

The example project should spin up at `http://localhost:3000`. `install_deps.sh` handles generating a tarball from the `src` directory to ensure proper dependency resolution for the example project and its dependencies. It also ensures that `next-urql`'s dependencies have already been installed and that the contents of the `src` directory have been built to `dist`. If you're modifying the `next-urql` `src` directory, you'll need to re-run this script to pick up changes.
