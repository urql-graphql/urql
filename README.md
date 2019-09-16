<div align="center">
  <img width="540" alt="urql" src="https://raw.githubusercontent.com/FormidableLabs/urql/master/docs/urql-banner.gif" />

  <br />
  <br />

  <strong>
    A highly customisable and versatile GraphQL client for React
  </strong>

  <br />
  <br />
  <a href="https://npmjs.com/package/urql">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/urql.svg" />
  </a>
  <a href="https://github.com/FormidableLabs/urql/actions">
    <img alt="Test Status" src="https://github.com/FormidableLabs/urql/workflows/CI/badge.svg" />
  </a>
  <a href="https://codecov.io/gh/FormidableLabs/urql">
    <img alt="Test Coverage" src="https://codecov.io/gh/FormidableLabs/urql/branch/master/graph/badge.svg" />
  </a>
  <a href="https://bundlephobia.com/result?p=urql">
    <img alt="Minified gzip size" src="https://img.shields.io/bundlephobia/minzip/urql.svg?label=gzip%20size" />
  </a>
  <a href="https://github.com/FormidableLabs/urql#maintenance-status">
    <img alt="Maintenance Status" src="https://img.shields.io/badge/maintenance-active-green.svg" />
  </a>
  <a href="https://spectrum.chat/urql">
    <img alt="Spectrum badge" src="https://withspectrum.github.io/badge/badge.svg" />
  </a>

  <br />
  <br />
</div>

## ✨ Features

- 📦 **One package** to get a working GraphQL client in React
- ⚙️ Fully **customisable** behaviour [via "exchanges"](#-add-on-exchanges)
- 🗂 Logical but simple default behaviour and document caching
- ⚛️ Minimal React components and hooks

`urql` is a GraphQL client that exposes a set of React components and hooks. It's built to be highly customisable and versatile so you can take it from getting started with your first GraphQL project all the way to building complex apps and experimenting with GraphQL clients.

While GraphQL is an elegant protocol and schema language, client libraries today typically come with large API footprints. We aim to create something more lightweight instead.

Some of the available exchanges that extend `urql` are listed below in the ["Add on Exchanges" list](https://github.com/FormidableLabs/urql#-add-on-exchanges) including a normalized cache and a Chrome devtools extension.

## 📃 [Documentation](https://formidable.com/open-source/urql/docs)

[The documentation contains everything you need to know about `urql`](https://formidable.com/open-source/urql/docs)

- [Getting Started guide](https://formidable.com/open-source/urql/docs/getting-started/)
- [Architecture](https://formidable.com/open-source/urql/docs/architecture/)
- [Basics](https://formidable.com/open-source/urql/docs/basics/)
- [Extending & Experimenting](https://formidable.com/open-source/urql/docs/extending-&-experimenting/)
- [API](https://formidable.com/open-source/urql/docs/api/)
- [Guides](./docs/guides.md)

_You can find the raw markdown files inside this repository's `docs` folder._

## 🏎️ Quick Start Guide

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

This allows you to use the `useQuery` hook in your function component to
fetch data from your server:

```js
import { useQuery } from 'urql';

const YourComponent = () => {
  const [result] = useQuery({
    query: `{ todos { id } }`,
  });

  const { fetching, data } = result;
  return fetching ? <Loading /> : <List data={data.todos} />;
};
```

Alternatively you can take advantage of the `<Query>` component:

```js
import { Query } from 'urql';

<Query query="{ todos { id } }">
  {({ fetching, data }) =>
    fetching ? <Loading /> : <List data={data.todos} />
  }
</Query>;
```

[Learn the full API in the "Getting Started" docs!](https://formidable.com/open-source/urql/docs/getting-started/)

## 📦 Add on Exchanges

`urql` can be extended by adding "Exchanges" to it, [which you can read
more about in our docs](https://formidable.com/open-source/urql/docs/architecture/#exchanges)! Here's just a couple of them.

- [`@urql/devtools`](https://github.com/FormidableLabs/urql-devtools): A Chrome extension for monitoring and debugging
- [`@urql/exchange-graphcache`](https://github.com/FormidableLabs/urql-exchange-graphcache): A full normalized cache implementation (beta)
- [`@urql/exchange-suspense`](https://github.com/FormidableLabs/urql-exchange-suspense): An experimental exchange for using `<React.Suspense>`
- [`urql-persisted-queries`](https://github.com/Daniel15/urql-persisted-queries): An exchange for adding persisted query support

[You can find the full list of exchanges in the docs.](./docs/exchanges.md)

## 💡 Examples

There are currently three examples included in this repository:

- [Getting Started: A basic app with queries and mutations](examples/1-getting-started/)
- [Using Subscriptions: An app that demos subscriptions](examples/2-using-subscriptions/)
- [SSR with Next: A Next.js app showing server-side-rendering support](examples/3-ssr-with-nextjs/)

## Maintenance Status

**Active:** Formidable is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.
