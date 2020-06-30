<div align="center">
  <br />
  <br />
  <a href="https://www.npmjs.com/package/@urql/preact">
    <img alt="Npm version" src="https://badgen.net/npm/v/@urql/preact" />
  </a>
  <a href="https://travis-ci.com/JoviDeCroock/preact-urql">
    <img alt="Test Status" src="https://api.travis-ci.com/JoviDeCroock/preact-urql.svg?branch=main" />
  </a>
  <a href="https://codecov.io/gh/JoviDeCroock/preact-urql">
    <img alt="Test Coverage" src="https://codecov.io/gh/JoviDeCroock/preact-urql/branch/main/graph/badge.svg" />
  </a>
  <a href="https://bundlephobia.com/result?p=@urql/preact">
    <img alt="Minified gzip size" src="https://img.shields.io/bundlephobia/minzip/@urql/preact.svg?label=gzip%20size" />
  </a>
  <a href="https://spectrum.chat/urql">
    <img alt="Spectrum badge" src="https://withspectrum.github.io/badge/badge.svg" />
  </a>
  <br />
  <br />
</div>

## Installation

```sh
yarn add @urql/preact urql graphql
# or
npm install --save @urql/preact urql graphql
```

## Usage

The usage is a 1:1 mapping of the React usage found [here](https://formidable.com/open-source/urql/docs)

small example:

```jsx
import { createClient, defaultExchanges, Provider, useQuery } from '@urql/preact';

const client = createClient({
  url: 'https://myHost/graphql',
  exchanges: defaultExchanges,
});

const App = () => (
  <Provider value={client}>
    <Dogs />
  </Provider>
);

const Dogs = () => {
  const [result] = useQuery({
    query: `{ dogs { id name } }`,
  });

  if (result.fetching) return <p>Loading...</p>;
  if (result.error) return <p>Oh no...</p>;

  return result.data.dogs.map(dog => <p>{dog.name} is a good boy!</p>);
};
```
