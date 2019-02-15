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

`urql` is mainly a GraphQL client, but also exposes a set of React components.
It's built to be highly customisable and versatile, so you can take it from building
your first GraphQL or playing around with complex GraphQL experiments, all the
way to building a highly sophisticated GraphQL data management library.

While GraphQL is an elegant protocol that constrains and informs the data that is returned
from APIs, this library exists because existing solutions are a bit heavy on the API side
of things. Instead of replacing sane data management that should be easy,
`urql` strives to make them as simple as possible.

## Quick Start Guide

First, install `urql`:

```sh
yarn add urql
# or
npm intall --save urql
```

Then try to create a client and wrap your app with a `<Provider>`:

```js
import { Provider, createClient } from 'urql';

const client = createClient({
  url: 'http://localhost:1234/graphql',
});

// ...
<Provider value={client}>
  <YourApp />
</Provider>;
```

This allows you to use the `<Connect>` component, for instance,
to query your GraphQL API:

```js
import { Connect, createQuery } from 'urql';

// ...

<Connect query={createQuery(`{ todos { id } }`)}>
  {({ fetching, data }) =>
    fetching ? <Loading /> : <List data={data.todos} />
  }
</Connect>;
```

You can also send mutations, which can be passed into the same `<Connect>`
component:

```js
import { Connect, createMutation } from 'urql';

// ...

<Connect mutations={{
  addTodo: createMutation(`mutation { addTodo(text: "Example") { id } }`)
}}>
  {({ mutations }) => (
    /* mutations.addTodo() sends the mutation and returns a promise */
  )}
</Connect>
```

[Learn more about urql's "Usage" in the docs](./TODO.md)
