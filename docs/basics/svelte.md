---
title: Svelte Bindings
order: 2
---

# Svelte

## Getting started

This "Getting Started" guide covers how to install and set up `urql` and provide a `Client` for
Svelte. The `@urql/svelte` package, which provides bindings for Svelte, doesn't fundamentally
function differently from `@urql/preact` or `urql` and uses the same [Core Package and
`Client`](./core.md).

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

Note: if using Vite as your bundler, you might stumble upon the error `Function called outside component initialization`, which will prevent the page from loading. To fix it, you must add `@urql/svelte` to Vite's configuration property [`optimizeDeps.exclude`](https://vitejs.dev/config/#dep-optimization-options):

```js
{
  optimizeDeps: {
    exclude: ['@urql/svelte'],
  }
  // other properties
}
```

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
  import { createClient, setContextClient } from '@urql/svelte';

  const client = createClient({
    url: 'http://localhost:3000/graphql',
  });

  setContextClient(client);
</script>
```

The `setContextClient` method internally calls [Svelte's `setContext`
function](https://svelte.dev/docs#run-time-svelte-setcontext). The `@urql/svelte` package also exposes a `getContextClient`
function that uses [`getContext`](https://svelte.dev/docs#run-time-svelte-getcontext) to retrieve the `Client` in
child components. This is used to input the client into `@urql/svelte`'s API.

## Queries

We'll implement queries using the `queryStore` function from `@urql/svelte`.

The `queryStore` function creates a [Svelte Writable store](https://svelte.dev/docs#writable).
You can use it to initialise a data container in `urql`. This store holds on to our query inputs,
like the GraphQL query and variables, which we can change to launch new queries. It also exposes
the query's eventual result, which we can then observe.

### Run a first query

For the following examples, we'll imagine that we're querying data from a GraphQL API that contains
todo items. Let's dive right into it!

```js
<script>
  import { queryStore, gql, getContextClient } from '@urql/svelte';

  const todos = queryStore({
    client: getContextClient(),
    query: gql`
      query {
        todos {
          id
          title
        }
      }
    `,
  });
</script>

{#if $todos.fetching}
<p>Loading...</p>
{:else if $todos.error}
<p>Oh no... {$todos.error.message}</p>
{:else}
<ul>
  {#each $todos.data.todos as todo}
  <li>{todo.title}</li>
  {/each}
</ul>
{/if}
```

Here we have implemented our first GraphQL query to fetch todos. We're first creating a
`queryStore` which will start our GraphQL query.

The `todos` store can now be used like any other Svelte store using a
[reactive auto-subscription](https://svelte.dev/tutorial/auto-subscriptions) in Svelte. This means
that we prefix `$todos` with a dollar symbol, which automatically subscribes us to its changes.

### Variables

Typically we'll also need to pass variables to our queries, for instance, if we are dealing with
pagination. For this purpose the `queryStore` also accepts a `variables` argument, which we can
use to supply variables to our query.

```js
<script>
  import { queryStore, getContextClient, gql } from '@urql/svelte';

  $: todos = queryStore({
    client: getContextClient(),
    query: gql`
      query ($from: Int!, $limit: Int!) {
        todos(from: $from, limit: $limit) {
          id
          title
        }
      }
    `,
    variables: { from, limit }
  );
</script>
...
```

> Note that we prefix the variable with `$` so Svelte knows that this store is reactive

As when we're sending GraphQL queries manually using `fetch`, the variables will be attached to the
`POST` request body that is sent to our GraphQL API.

The `queryStore` also supports being actively changed. This will hook into Svelte's reactivity
model as well and cause the `query` utility to start a new operation.

```js
<script>
  import { queryStore, getContextClient, gql } from '@urql/svelte';

  let limit = 10;
  let from = 0;
  $: todos = queryStore({
    client: getContextClient(),
    query: gql`
      query ($from: Int!, $limit: Int!) {
        todos(from: $from, limit: $limit) {
          id
          title
        }
      }
    `,
    variables: { from, limit }
  );

  query(todos);

  function nextPage() {
    from = from + 10
  }
</script>

<button on:click={nextPage}>Next page<button></button></button>
```

### Pausing Queries

In some cases we may want our queries to not execute until a pre-condition has been met. Since the
`query` operation exists for the entire component lifecycle however, it can't just be stopped and
started at will. Instead, the `queryStore` accepts a key named `pause` that will tell the store that
is starts out as paused.

For instance, we may start out with a paused store and then unpause it once a callback is invoked:

```html
<script>
  import { queryStore, gql, getContextClient } from '@urql/svelte';

  $: todos = queryStore({
    client: getContextClient(),
    query: gql`
      query {
        todos {
          id
          title
        }
      }
    `,
    pause: true,
  });

  function unpause() {
    $todos.resume();
  }
</script>

<button on:click="{unpause}">Unpause</button>
```

### Request Policies

The `queryStore` also accepts another key apart from `query` and `variables`. Optionally
you may pass a `requestPolicy`.

The `requestPolicy` option determines how results are retrieved from our `Client`'s cache. By
default, this is set to `cache-first`, which means that we prefer to get results from our cache, but
are falling back to sending an API request.

Request policies aren't specific to `urql`'s Svelte bindings, but are a common feature in its core.
[You can learn more about how the cache behaves given the four different policies on the "Document
Caching" page.](../basics/document-caching.md)

```js
<script>
  import { queryStore, gql, getContextClient } from '@urql/svelte';

  $: todos = queryStore({
    client: getContextClient(),
    query: gql`
      query {
        todos {
          id
          title
        }
      }
    `,
    requestPolicy: 'cache-and-network'
  });
</script>

...
```

As we can see, the `requestPolicy` is easily changed by passing it directly as a "context option"
when creating a `queryStore`.

Internally, the `requestPolicy` is just one of several "**context** options". The `context`
provides metadata apart from the usual `query` and `variables` we may pass. This means that
we may also change the `Client`'s default `requestPolicy` by passing it there.

```js
import { createClient } from '@urql/svelte';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  // every operation will by default use cache-and-network rather
  // than cache-first now:
  requestPolicy: 'cache-and-network',
});
```

### Context Options

As mentioned, the `requestPolicy` option that we're passing to the `queryStore` is a part of
`urql`'s context options. In fact, there are several more built-in context options, and the
`requestPolicy` option is one of them. Another option we've already seen is the `url` option, which
determines our API's URL.

```js
<script>
  import { queryStore, gql, getContextClient } from '@urql/svelte';

  $: todos = queryStore({
    client: getContextClient(),
    query: gql`
      query {
        todos {
          id
          title
        }
      }
    `,
    context: { url: 'http://localhost:3000/graphql?debug=true', }
  });
</script>

...
```

As we can see, the `context` argument for `queryStore` accepts any known `context` option and
can be used to alter them per query rather than globally. The `Client` accepts a subset of `context`
options, while the `queryStore` argument does the same for a single query. They're then merged
for your operation and form a full `Context` object for each operation, which means that any given
query is able to override them as needed.

[You can find a list of all `Context` options in the API docs.](../api/core.md#operationcontext)

### Reading on

There are some more tricks we can use with `queryStore`.
[Read more about its API in the API docs for it.](../api/svelte.md#queryStore)

## Mutations

The `mutationStore` function isn't dissimilar from the `queryStore` function but is triggered manually and
can accept a [`GraphQLRequest` object](../api/core.md#graphqlrequest).

### Sending a mutation

Let's again pick up an example with an imaginary GraphQL API for todo items, and dive into an
example! We'll set up a mutation that _updates_ a todo item's title.

```html
<script>
  import { mutationStore, gql, getContextClient } from '@urql/svelte';

  export let id;

  let result;
  const updateTodo = ({ id, title }) => {
    result = mutationStore({
      client: getContextClient(),
      query: gql`
        mutation($id: ID!, $title: String!) {
          updateTodo(id: $id, title: $title) {
            id
            title
          }
        }
      `,
      variables: { id, title },
    });
  };
</script>
```

This small call to `mutationStore` accepts a `query` property (besides the `variables` property) and
returns an execute function.

Unlike the `query` function, we don't want the mutation to start automatically hence we enclose it in
a function. The `result` will be updated with the `fetching`, `data`, ... as a normal query would which
you can in-turn use in your UI.

### Handling mutation errors

It's worth noting that the promise we receive when calling the execute function will never
reject. Instead it will always return a promise that resolves to an `mutationStore`, even if the
mutation has failed.

If you're checking for errors, you should use `mutationStore.error` instead, which will be set
to a `CombinedError` when any kind of errors occurred while executing your mutation.
[Read more about errors on our "Errors" page.](./errors.md)

```jsx
mutateTodo({ id, title: newTitle }).then(result => {
  if (result.error) {
    console.error('Oh no!', result.error);
  }
});
```

## Reading on

This concludes the introduction for using `urql` with Svelte. The rest of the documentation
is mostly framework-agnostic and will apply to either `urql` in general, or the `@urql/core` package,
which is the same between all framework bindings. Hence, next we may want to learn more about one of
the following to learn more about the internals:

- [How does the default "document cache" work?](./document-caching.md)
- [How are errors handled and represented?](./errors.md)
- [A quick overview of `urql`'s architecture and structure.](../architecture.md)
- [Setting up other features, like authentication, uploads, or persisted queries.](../advanced/README.md)
