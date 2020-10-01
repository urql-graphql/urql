---
title: Getting started
order: 0
---

# Getting started

In the ["Introduction"](./README.md) we read how `urql` consists of multiple constituent parts that
make up a GraphQL client. Hence there are multiple packages — one for each framework we officially
support — that we'll get started with on this page.

## React & Preact

This "Getting Started" guide covers how to install and set up `urql` and the `Client`, for React and
Preact. Since the `urql` and `@urql/preact` packages share most of their API and are used in the
same way, when reading the documentation on React, all examples are essentially the same, except
that we'd want to use the `@urql/preact` package instead of the `urql` package for Preact.

### Installation

Installing `urql` is as quick as you'd expect and you won't need any other packages to get started
with at first. We'll install the package with our package manager of choice.

```sh
yarn add urql graphql
# or
npm install --save urql graphql
```

To use `urql` with Preact, we have to install `@urql/preact` instead of `urql` and import from
that package instead. Otherwise all examples for Preact will be the same.

Most libraries related to GraphQL also need the `graphql` package to be installed as a peer
dependency, so that they can adapt to your specific versioning requirements. That's why we'll need
to install `graphql` alongside `urql`.

Both the `urql` and `graphql` packages follow [semantic versioning](https://semver.org) and all
`urql` packages will define a range of compatible versions of `graphql`. Watch out for breaking
changes in the future however, in which case your package manager may warn you about `graphql` being
out of the defined peer dependency range.

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
passed to `fetch` when a request is sent to the given API `url`. We may pass in an options object or
a function returning an options object.

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

[On the next page we'll learn about executing "Queries".](./queries.md#react--preact)

## Svelte

This "Getting Started" guide covers how to install and set up `urql` and provide a `Client` for
Svelte. The `@urql/svelte` package, which provides bindings for Svelte, doesn't fundamentally
function differently from `@urql/preact` or `urql` and uses the same [Core Package and
`Client`](../concepts/core-package.md).

### Installation

Installing `@urql/svelte` is quick and no other packages are immediately necessary.

```sh
yarn add @urql/svelte graphql
# or
npm install --save @urql/svelte graphql
```

Most libraries related to GraphQL also need the `graphql` package to be installed as a peer
dependency, so that they can adapt to your specific versioning requirements. That's why we'll need
to install `graphql` alongside `@urql/svelte`.

Both the `@urql/svelte` and `graphql` packages follow [semantic versioning](https://semver.org) and
all `@urql/svelte` packages will define a range of compatible versions of `graphql`. Watch out
for breaking changes in the future however, in which case your package manager may warn you about
`graphql` being out of the defined peer dependency range.

### Setting up the `Client`

The `@urql/svelte` package exports a method called `createClient` which we can use to create
the GraphQL client. This central `Client` manages all of our GraphQL requests and results.

```js
import { createClient } from '@urql/svelte';

const client = createClient({
  url: 'http://localhost:3000/graphql',
});
```

At the bare minimum we'll need to pass an API's `url` when we create a `Client` to get started.

Another common option is `fetchOptions`. This option allows us to customize the options that will be
passed to `fetch` when a request is sent to the given API `url`. We may pass in an options object or
a function returning an options object.

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

To make use of the `Client` in Svelte we will have to provide it via the
[Context API](https://svelte.dev/tutorial/context-api). From a parent component to its child
components. This will share one `Client` with the rest of our app, if we for instance provide the
`Client`

```html
<script>
  import { createClient, setClient } from '@urql/svelte';

  const client = createClient({
    url: 'http://localhost:3000/graphql',
  });

  setClient(client);
</script>
```

The `setClient` method internally calls [Svelte's `setContext`
function](https://svelte.dev/docs#setContext). The `@urql/svelte` package also exposes a `getClient`
function that uses [`getContext`](https://svelte.dev/docs#getContext) to retrieve the `Client` in
child components. This is used throughout `@urql/svelte`'s API.

We can also use a convenience function, `initClient`. This function combines the `createClient` and
`setClient` calls into one.

```html
<script>
  import { initClient } from '@urql/svelte';

  initClient({
    url: 'http://localhost:3000/graphql',
  });
</script>
```

[On the next page we'll learn about executing "Queries".](./queries.md#svelte)
