# Integrating `@urql/exchange-retry`’s retryExchange

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
