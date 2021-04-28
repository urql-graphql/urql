# Integrating with `@urql/exchange-persisted-fetch`’s persistedFetchExchange

Integrating urql is as simple as:

1. Install packages [getting started](https://formidable.com/open-source/urql/docs/basics/react-preact/)

```sh
yarn add urql graphql
# or
npm install --save urql graphql
```

2. Then install the package for [automatic persisted queries](https://formidable.com/open-source/urql/docs/advanced/persistence-and-uploads/)


```sh
yarn add @urql/exchange-persisted-fetch
# or
npm install --save @urql/exchange-persisted-fetch
```

3. Setting up the Client and adding persistedFetchExchange [here](src/App.js)

4. Execute the Query [here](src/pages/LocationsList.js)
