# urql

<div align="center">
  <strong>
    A highly customisable and versatile GraphQL client for React
  </strong>
  <br />
  <br />
  <a href="https://travis-ci.org/FormidableLabs/urql">
    <img alt="Build Status" src="https://travis-ci.org/FormidableLabs/urql.svg?branch=master" />
  </a>
  <a href="https://coveralls.io/github/FormidableLabs/urql?branch=master">
    <img alt="Test Coverage" src="https://coveralls.io/repos/github/FormidableLabs/urql/badge.svg?branch=master" />
  </a>
  <a href="https://npmjs.com/package/urql">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/urql.svg" />
  </a>
  <a href="https://github.com/FormidableLabs/urql#maintenance-status">
    <img alt="Maintenance Status" src="https://img.shields.io/badge/maintenance-active-green.svg" />
  </a>
  <br />
  <br />
</div>

<img width="965" alt="Steve Urkel" src="https://user-images.githubusercontent.com/1457604/52959744-ee6cef80-338e-11e9-96fe-cf5231b8eab7.png">

## ✨ Features

- 📦 **One package** to get a working GraphQL client in React
- ⚙️ Fully **customisable** behaviour via "exchanges"
- 🗂 Logical but simple default behaviour and document caching
- ⚛️ Minimal React components and hooks

`urql` is a GraphQL client that exposes a set of React components and hooks. It's built to be highly customisable and versatile so you can take it from getting started with your first GraphQL project all the way to building complex apps and experimenting with GraphQL clients.

While GraphQL is an elegant protocol and schema language, client libraries today typically come with large API footprints. We aim to create something more lightweight instead.

## [Documentation](docs/README.md)

[The documentation contains everything you need to know about `urql`](docs/README.md)

- [Getting Started guide](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [Basics](docs/basics.md)
- [Extending & Experimenting](docs/extending-and-experimenting.md)
- [API](docs/api.md)

## Quick Start Guide

First install `urql` and `graphql`:

```sh
yarn add urql graphql
# or
npm install --save urql graphql
```

Create a client for your endpoint url and wrap your app with a `<Provider>` component which `urql` exposes:

```js
import { Provider, createClient } from 'urql';

const client = createClient({
  url: 'http://localhost:1234/graphql', // Your GraphQL endpoint here
});

ReactDOM.render(
  <Provider value={client}>
    <YourApp />
  </Provider>,
  document.body
);
```

This allows you to now use the `<Query>` component to fetch data from your server:

```js
import { Query } from 'urql';

<Query query="{ todos { id } }">
  {({ fetching, data }) =>
    fetching ? <Loading /> : <List data={data.todos} />
  }
</Query>;
```

Alternatively you can take advantage of the `useQuery` hook in your function component:

```js
import { useQuery } from 'urql';

const YourComponent = () => {
  const [{ fetching, data }] = useQuery({ query: `{ todos { id } }` });
  return fetching ? <Loading /> : <List data={data.todos} />;
};
```

[Learn the full API in the "Getting Started" docs!](docs/getting-started.md)

## Examples

There are currently two examples included in this repository:

- [getting-started: A basic app with queries and mutations](examples/1-getting-started/)
- [using-subscriptions: A basic app that demos subscriptions](examples/2-using-subscriptions/)

## Maintenance Status

**Active:** Formidable is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.
