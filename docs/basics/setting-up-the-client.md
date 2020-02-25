---
title: Getting started
order: 0
---

# Getting started

## React/Preact

### Installation

Installing `urql` is as quick as you'd expect. Firstly, install it
with your package manager of choice, Note: this installation is specific for React:

```sh
yarn add urql graphql
# or
npm install --save urql graphql
```

To use urql with Preact, you have to install `@urql/preact` instead of urql and import from
that package instead.

> _Note:_ Most libraries related to GraphQL specify `graphql` as their peer
> dependency so that they can adapt to your specific versioning
> requirements.
> The library is updated frequently and remains very backwards compatible,
> but make sure it will work with other GraphQL tooling you might have installed.

### Setting up the client

The package will export a method called `createClient` we can use this to create the
client that will be used to dispatch our queries, mutations, etc.
```js
import { createClient } from 'urql';

const client = createClient({
  url: 'http://localhost:3000/graphql',
});
```

This is the bare minimum you need to get started with your client.

One option you will most likely need in most applications is the `fetchOptions`,
this option allows you to customize the `fetch` request sent to the given url.

This is a function or an object, in the following example we tell our client a token
should be added whenever it's present.

```js
const client = createClient({
  url: 'http://localhost:3000/graphql',
  fetchOptions: () => {
    const token = getToken();
    return {
      headers: { authorization: token ? `Bearer ${token}` : '' },
    };
  },
});
```

### Providing the client

To make use of this client in (P)React we will have to provide the client through
the context API. This is done with the help of the `Provider` export.

```jsx
import { createClient, Provider } from 'urql';

const client = createClient({
  url: 'http://localhost:3000/graphql',
});

const App = () => (
  <Provider value={client}>
    <YourRoutes />
  </Provider>
);
```

Now all the children of `<App />` will have access to the client we declared.
