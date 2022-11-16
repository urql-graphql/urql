<div align="center">
  <br />
  <br />
  <a href="https://www.npmjs.com/package/@urql/preact">
    <img alt="Npm version" src="https://badgen.net/npm/v/@urql/preact" />
  </a>
  <a href="https://bundlephobia.com/result?p=@urql/preact">
    <img alt="Minified gzip size" src="https://img.shields.io/bundlephobia/minzip/@urql/preact.svg?label=gzip%20size" />
  </a>
  <a href="https://github.com/urql-graphql/urql/discussions">
    <img alt="GitHub Discussions: Chat With Us" src="https://badgen.net/badge/discussions/chat%20with%20us/purple" />
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
