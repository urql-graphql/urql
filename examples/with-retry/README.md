# Integrating `@urql/exchange-retry`’s retryExchange

<p>
  <a href="https://stackblitz.com/github/urql-graphql/urql/tree/main/examples/with-retry">
    <img
      alt="Open in StackBlitz"
      src="https://img.shields.io/badge/open_in_stackblitz-1269D3?logo=stackblitz&style=for-the-badge"
    />
  </a>
  <a href="https://codesandbox.io/p/sandbox/github/urql-graphql/urql/tree/main/examples/with-retry">
    <img
      alt="Open in CodeSandbox"
      src="https://img.shields.io/badge/open_in_codesandbox-151515?logo=codesandbox&style=for-the-badge"
    />
  </a>
</p>

Integrating urql is as simple as:

1.  Install packages

```sh
yarn add urql graphql
# or
npm install --save urql graphql
```

2. Add [retry exchange](https://formidable.com/open-source/urql/docs/advanced/retry-operations/)

```sh
yarn add @urql/exchange-retry
# or
npm install --save @urql/exchange-retry
```

3.  Setting up the Client and adding the `retryExchange` [here](src/App.js)

4.  Execute the Query [here](src/pages/Color.js)

# With Retry

This example shows `urql` in use with `@urql/exchange-retry`'s `retryExchange`
to implement retrying failed operations. This largely follows the ["Retrying Operations" docs
page](https://formidable.com/open-source/urql/docs/advanced/retry-operations/)
and uses the [`trygql.formidable.dev/graphql/intermittent-colors`
schema](https://github.com/FormidableLabs/trygql), which emits a special `NO_SOUP` error randomly.

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
- The `retryExchange` from `@urql/exchange-retry` in [`src/App.jsx`](src/App.jsx)
- A random colour query in [`src/Color.jsx`](src/pages/Color.jsx)
