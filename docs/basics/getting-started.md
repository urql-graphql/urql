---
title: Getting started
order: 0
---

# Getting started

In the ["Introduction"](./README.md) we read how `urql` consists of multiple constituent parts that
make up a GraphQL client. Hence there are multiple packages — one for each framework we officially
support — that you'll get started with.

## React & Preact

This "Getting Started" guide covers how to install and set up `urql` and the Client, for React and
Preact. Since the `urql` and `@urql/preact` packages share most of their API one-to-one, when
reading the documentation on React, all examples are essentially the same, except that we'll use the
`@urql/preact` package instead of the `urql` package for Preact.

### Installation

Installing `urql` is as quick as you'd expect and you won't need any other packages to get started
with at first. We'll install the package with our package manager of choice.

```sh
yarn add urql graphql
# or
npm install --save urql graphql
```

To use urql with Preact, we have to install `@urql/preact` instead of `urql` and import from
that package instead. Otherwise all examples for Preact will be the same.

Most libraries related to GraphQL also need the `graphql` package to be installed as a peer
dependency, so that they can adapt to your specific versioning requirements, which is why we'll need
to install `graphql` as well.

Both the `urql` packages and `graphql` follow [semantic versioning](https://semver.org) and `urql`
packages will define a range of compatible versions of `graphql`. Watch out for breaking changes in
the future however, in which case your package manager may warn you about `graphql` being out of the
defined peer dependency range.

### Setting up the `Client`

The `urql` and `@urql/preact` packages export a method called `createClient` which we can use to
create the GraphQL client. This central `Client` manages all of our GraphQL requests and results.

```js
import { createClient } from 'urql';

const client = createClient({
  url: 'http://localhost:3000/graphql',
});
```

At the bare minimum we'll need to pass an API's `url` when we create a `Client` to get started.

Another common option is `fetchOptions`. This option allows us to customize the options that will be
passed to `fetch` when a request is sent to the given API `url`. We may pass in an object or a
function returning an object to this option.

In the following example we'll add a token to each `fetch` request that our `Client` sends to our
GraphQL API.

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

### Providing the `Client`

To make use of the `Client` in React & Preact we will have to provide it via the
[Context API](https://reactjs.org/docs/context.html). This may be done with the help of
the `Provider` export.

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

Now every component and element inside and under the `Provider` are able to use GraphQL queries that
will be sent to our API.
