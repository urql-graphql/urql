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
  <br />
  <br />
</div>

<img alt="Urkel" src="https://images-production.global.ssl.fastly.net/uploads/posts/image/97733/jaleel-white-steve-urkel.jpg" />

## ✨ Features

- **One package** to get a working GraphQL client in React
- Fully **customisable** behaviour via "exchanges"
- Sane but simple default behaviour and document caching
- Minimal React components and hooks

`urql` is mainly a GraphQL client, but also exposes a set of React components and hooks.
It's built to be highly customisable and versatile, so you can take it from building
your first GraphQL app, to building full and comples apps, or all the way to experimenting
with GraphQL clients.

While GraphQL is an elegant protocol that constrains and informs the data that is returned
from APIs, this library exists because existing solutions are a bit heavy on the API side
of things. Instead of replacing sane data management that should be easy,
`urql` strives to make them as simple as possible.

## [Documentation](docs/README.md)

[The documentation contains everything you need to know about `urql`](docs/README.md)

- [Getting Started guide](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [Basics](docs/basics.md)
- [Extending & Experimenting](docs/extending-and-experimenting.md)
- [API](docs/api.md)

## Quick Start Guide

First, install `urql` and `graphql`, which is a peer dependency:

```sh
yarn add urql graphql
# or
npm intall --save urql graphql
```

Then try to create a client and wrap your app with a `<Provider>`:

```js
import { Provider, createClient } from 'urql';

const client = createClient({
  url: 'http://localhost:1234/graphql', // Your GraphQL endpoint here
});

<Provider value={client}>
  <YourApp />
</Provider>;
```

This allows you to use the `<Query>` component to send some first
queries:

```js
import { Query } from 'urql';

<Query query={`{ todos { id } }`}>
  {({ fetching, data }) =>
    fetching ? <Loading /> : <List data={data.todos} />
  }
</Query>;
```

Or use the hooks-based API:

```js
import { useQuery } from 'urql';

const YourComponent = () => {
  const [{ fetching, data }] = useQuery(`{ todos { id } }`);
  return fetching ? <Loading /> : <List data={data.todos} />;
};
```

[Learn the full API in the "Getting Started" docs!](docs/getting-started.md)

## Examples

There are currently two examples included in this repository:

- [getting-started: A basic app with queries and mutations](examples/1-getting-started/)
- [using-subscriptions: A basic app that demos subscriptions](examples/2-using-subscriptions/)
