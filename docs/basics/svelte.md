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

## Queries

We'll implement queries using the `operationStore` and the `query` function from `@urql/svelte`.

The `operationStore` function creates a [Svelte Writable store](https://svelte.dev/docs#writable).
You can use it to initialise a data container in `urql`. This store holds on to our query inputs,
like the GraphQL query and variables, which we can change to launch new queries. It also exposes
the query's eventual result, which we can then observe.

### Run a first query

For the following examples, we'll imagine that we're querying data from a GraphQL API that contains
todo items. Let's dive right into it!

```jsx
<script>
  import { operationStore, query } from '@urql/svelte';

  const todos = operationStore(`
    query {
      todos {
        id
        title
      }
    }
  `);

  query(todos);
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

Here we have implemented our first GraphQL query to fetch todos. We're first creating an
`operationStore` which holds on to our `query` and are then passing the store to the `query`
function, which starts the GraphQL query.

The `todos` store can now be used like any other Svelte store using a
[reactive auto-subscription](https://svelte.dev/tutorial/auto-subscriptions) in Svelte. This means
that we prefix `$todos` with a dollar symbol, which automatically subscribes us to its changes.

The `query` function accepts our store and starts using the `Client` to execute our query. It may
only be called once for a store and lives alongside the component's lifecycle. It will automatically
read changes on the `operationStore` and will update our query and results accordingly.

### Variables

Typically we'll also need to pass variables to our queries, for instance, if we are dealing with
pagination. For this purpose the `operationStore` also accepts a `variables` argument, which we can
use to supply variables to our query.

```jsx
<script>
  import { operationStore, query } from '@urql/svelte';

  const todos = operationStore(`
    query ($from: Int!, $limit: Int!) {
      todos(from: $from, limit: $limit) {
        id
        title
      }
    }`,
    { from, limit }
  );

  query(todos);
</script>

...
```

As when we're sending GraphQL queries manually using `fetch`, the variables will be attached to the
`POST` request body that is sent to our GraphQL API.

The `operationStore` also supports being actively changed. This will hook into Svelte's reactivity
model as well and cause the `query` utility to start a new operation.

```jsx
<script>
  import { operationStore, query } from '@urql/svelte';

  const todos = operationStore(`
    query ($from: Int!, $limit: Int!) {
      todos(from: $from, limit: $limit) {
        id
        title
      }
    }`,
    { from, limit }
  );

  query(todos);

  function nextPage() {
    // it's important that we assign a new reference to variables.
    $todos.variables = { ...$todos.variables, from: $todos.variables.from + $todos.variables.limit };
    // OR
    $todos.variables.from += $todos.variables.limit;
    $todos.reexecute();
  }
</script>

<button on:click={nextPage}>Next page<button></button></button>
```

The `operationStore` provides getters as well, so it's also possible for us to pass `todos` around and
update `todos.variables` or `todos.query` directly. Both, updating `todos.variables` and
`$todos.variables` in a component for instance, will cause `query` to pick up the update and execute
our changes.

### Pausing Queries

In some cases we may want our queries to not execute until a pre-condition has been met. Since the
`query` operation exists for the entire component lifecycle however, it can't just be stopped and
started at will. Instead, the `query`'s third argument, the `context`, may have an added `pause`
option that can be set to `true` to temporarily _freeze_ all changes and stop requests.

For instance, we may start out with a paused store and then unpause it once a callback is invoked:

```html
<script>
  import { operationStore, query } from '@urql/svelte';

  const todo = operationStore(
    `
    query {
      todo {
        id
        title
      }
    }`,
    undefined,
    { pause: true }
  );

  query(todo);

  function unpause() {
    $todo.context.pause = false;
  }
</script>

<button on:click="{unpause}">Unpause</button>
```

### Request Policies

The `operationStore` also accepts another argument apart from `query` and `variables`. Optionally
you may pass a third argument, [the `context` object](../api/core.md#operationcontext). The arguably
most interesting option the `context` may contain is `requestPolicy`.

The `requestPolicy` option determines how results are retrieved from our `Client`'s cache. By
default, this is set to `cache-first`, which means that we prefer to get results from our cache, but
are falling back to sending an API request.

In total there are four different policies that we can use:

- `cache-first` (the default) prefers cached results and falls back to sending an API request when
  no prior result is cached.
- `cache-and-network` returns cached results but also always sends an API request, which is perfect
  for displaying data quickly while keeping it up-to-date.
- `network-only` will always send an API request and will ignore cached results.
- `cache-only` will always return cached results or `null`.

The `cache-and-network` policy is particularly useful, since it allows us to display data instantly
if it has been cached, but also refreshes data in our cache in the background. This means though
that `fetching` will be `false` for cached results although an API request may still be ongoing in
the background.

For this reason there's another field on results, `result.stale`, which indicates that the cached
result is either outdated or that another request is being sent in the background.

```jsx
<script>
  import { operationStore, query } from '@urql/svelte';

  const todos = operationStore(`
    query ($from: Int!, $limit: Int!) {
      todos(from: $from, limit: $limit) {
        id
        title
      }
    }`,
    { from, limit },
    { requestPolicy: 'cache-and-network' }
  );

  query(todos);
</script>

...
```

As we can see, the `requestPolicy` is easily changed, and we can read our `context` option back
from `todos.context`, just as we can check `todos.query` and `todos.variables`. Updating
`operationStore.context` can be very useful to also refetch queries, as we'll see in the next
section.

[You can learn more about request policies on the API docs.](../api/core.md#requestpolicy)

### Reexecuting Queries

The default caching approach in `@urql/svelte` typically takes care of updating queries on the fly
quite well and does so automatically. Sometimes it may be necessary though to refetch data and to
execute a query with a different `context`. Triggering a query programmatically may be useful in a
couple of cases. It can for instance be used to refresh data.

We can trigger a new query update by changing out the `context` of our `operationStore`. While we
can simply assign a new context value using `$todos.context = {}` we can also use the store's
`reexecute` method as syntactic sugar for this:

```jsx
<script>
  import { operationStore, query } from '@urql/svelte';

  const todos = operationStore(`
    query ($from: Int!, $limit: Int!) {
      todos(from: $from, limit: $limit) {
        id
        title
      }
    }`,
    { from, limit },
    { requestPolicy: 'cache-first' }
  );

  query(todos);

  function refresh() {
    todos.reexecute({ requestPolicy: 'network-only' });
  }
</script>
```

Calling `refresh` in the above example will execute the query again forcefully, and will skip the
cache, since we're passing `requestPolicy: 'network-only'`.

### Reading on

There are some more tricks we can use with `operationStore`.
[Read more about its API in the API docs for it.](../api/svelte.md#operationStore)

## Mutations

The `mutation` function isn't dissimilar from the `query` function but is triggered manually and
can accept a [`GraphQLRequest` object](../api/core.md#graphqlrequest), while also supporting our
trusty `operationStore`.

### Sending a mutation

Let's again pick up an example with an imaginary GraphQL API for todo items, and dive into an
example! We'll set up a mutation that _updates_ a todo item's title.

```html
<script>
  import { mutation } from '@urql/svelte';

  export let id;

  const mutateTodo = mutation({
    query: `
      mutation ($id: ID!, $title: String!) {
        updateTodo (id: $id, title: $title) {
          id
          title
        }
      }
    `,
  });

  function updateTodo(newTitle) {
    mutateTodo({ id, title: newTitle });
  }
</script>
```

This small call to `mutation` accepts a `query` property (besides the `variables` property) and
returns an execute function. We've wrapped it in an `updateTodo` function to illustrate its usage.

Unlike the `query` function, the `mutation` function doesn't start our mutation automatically.
Instead, mutations are started programmatically by calling the function they return. This function
also returns a promise so that we can use the mutation's result.

### Using the mutation result

When calling `mutateTodo` in our previous example, we start the mutation. To use the mutation's
result we actually have two options instead of one.

The first option is to use the promise that the `mutation`'s execute function returns. This promise
will resolve to an `operationStore`, which is what we're used to from sending queries. Using this
store we can then read the mutation's `data` or `error`.

```html
<script>
  import { mutation } from '@urql/svelte';

  export let id;

  const mutateTodo = mutation({
    query: `
      mutation ($id: ID!, $title: String!) {
        updateTodo (id: $id, title: $title) {
          id
          title
        }
      }
    `,
  });

  function updateTodo(newTitle) {
    mutateTodo({ id, title: newTitle }).then(result => {
      // The result is an operationStore again, which will already carry the mutation's result
      console.log(result.data, result.error);
    });
  }
</script>
```

Alternatively, we can pass `mutation` an `operationStore` directly. This allows us to use a
mutation's result in our component's UI more easily, without storing it ourselves.

```html
<script>
  import { operationStore, mutation } from '@urql/svelte';

  export let id;

  const updateTodoStore = operationStore(`
    mutation ($id: ID!, $title: String!) {
      updateTodo (id: $id, title: $title) {
        id
        title
      }
    }
  `);

  const updateTodoMutation = mutation(updateTodoStore);

  function updateTodo(newTitle) {
    updateTodoMutation({ id, title: newTitle });
  }
</script>

{#if $updateTodoStore.data} Todo was updated! {/if}
```

### Handling mutation errors

It's worth noting that the promise we receive when calling the execute function will never
reject. Instead it will always return a promise that resolves to an `operationStore`, even if the
mutation has failed.

If you're checking for errors, you should use `operationStore.error` instead, which will be set
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
