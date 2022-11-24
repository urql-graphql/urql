<div align="center">
  <img alt="logo" width=200 src="https://raw.githubusercontent.com/urql-graphql/urql-devtools/master/src/assets/icon.svg?sanitize=true" />
  <h1>Urql Devtools Exchange</h1>
  <p>The official devtools exchange for use with the <a href="https://github.com/urql-graphql/urql-devtools">Urql Devtools</a> browser extension</p>
  <a href="https://www.npmjs.com/package/@urql/devtools">
    <img alt="NPM Release" src="https://badgen.net/npm/v/@urql/devtools" />
  </a>
  <a href="https://github.com/urql-graphql/urql-devtools-exchange/blob/master/LICENSE">
    <img alt="Licence MIT" src="https://badgen.net/github/license/urql-graphql/urql-devtools-exchange" />
  </a>
</div>

## About

A first-party exchange for [urql](https://github.com/urql-graphql/urql) which interfaces with the [Urql Devtools](https://github.com/urql-graphql/urql-devtools) browser extension.

## Usage

Install this package

```sh
# npm
npm i @urql/devtools

# yarn
yarn add @urql/devtools
```

Add the exchange to your `urql` client

```js
import { createClient, defaultExchanges } from 'urql';
import { devtoolsExchange } from '@urql/devtools';

const client = createClient({
  url: 'http://localhost:3001/graphql',
  exchanges: [devtoolsExchange, ...defaultExchanges],
});
```

> Note: we recommended putting this exchange before all other exchanges (as demonstrated above)
