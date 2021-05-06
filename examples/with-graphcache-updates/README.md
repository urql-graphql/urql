# Integrating with `@urql/exchange-graphcache`'s cacheExchange Cache Updates

Integrating urql is as simple as:

1. Install packages [getting started](https://formidable.com/open-source/urql/docs/basics/react-preact/)

```sh
yarn add urql graphql
# or
npm install --save urql graphql
```

2. Install [graphcache](https://formidable.com/open-source/urql/docs/graphcache/)

```sh
yarn add @urql/exchange-graphcache
# or
npm install --save @urql/exchange-graphcache
```

3. Setting up the Client [here](src/App.js)

4. Configure the Client for handling cache updates [here](src/client/index.js#76) 

5. Execute the create Mutation [here](src/pages/Links.js)
