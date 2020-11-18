---
title: Queries
order: 1
---

# Queries

Let's get to querying our data! This page will teach us how we can retrieve our data declaratively
from our GraphQL API with the help of `urql`.

## React & Preact

This guide covers how to query data with React and Preact, which share almost the same API.

Both libraries offer a `useQuery` hook and a `Query` component. The latter accepts the same
parameters but we won't cover it in this guide. [Look it up in the API docs if you prefer
render-props components.](../api/urql.md#query-component)

### Run a first query

For the following examples, we'll imagine that we're querying data from a GraphQL API that contains
todo items. Let's dive right into it!

```jsx
import { useQuery } from 'urql';

const TodosQuery = `
  query {
    todos {
      id
      title
    }
  }
`;

const Todos = () => {
  const [result, reexecuteQuery] = useQuery({
    query: TodosQuery,
  });

  const { data, fetching, error } = result;

  if (fetching) return <p>Loading...</p>;
  if (error) return <p>Oh no... {error.message}</p>;

  return (
    <ul>
      {data.todos.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
};
```

Here we have implemented our first GraphQL query to fetch todos. We see that `useQuery` accepts
options and returns a tuple. In this case we've set the `query` option to our GraphQL query. The
tuple we then get in return is an array that contains a result object and a re-execute function.

The result object contains several properties. The `fetching` field indicates whether we're currently
loading data, `data` contains the actual `data` from the API's result, and `error` is set when either
the request to the API has failed or when our API result contained some `GraphQLError`s, which
we'll get into later on the ["Errors" page](./errors.md).

### Variables

Typically we'll also need to pass variables to our queries, for instance, if we are dealing with
pagination. For this purpose the `useQuery` hook also accepts a `variables` option, which we can use
to supply variables to our query.

```jsx
const TodosListQuery = `
  query ($from: Int!, $limit: Int!) {
    todos (from: $from, limit: $limit) {
      id
      title
    }
  }
`;

const Todos = ({ from, limit }) => {
  const [result, reexecuteQuery] = useQuery({
    query: TodosListQuery,
    variables: { from, limit },
  });

  // ...
};
```

As when we're sending GraphQL queries manually using `fetch`, the variables will be attached to the
`POST` request body that is sent to our GraphQL API.

Whenever the `variables` (or the `query`) option on the `useQuery` hook changes `fetching` will
switch to `true` and a new request will be sent to our API, unless a result has already been cached
previously.

### Pausing `useQuery`

In some cases we may want `useQuery` to execute a query when a pre-condition has been met, and not
execute the query otherwise. For instance, we may be building a form and want a validation query to
only take place when a field has been filled out.

Since hooks in React can't just be commented out, the `useQuery` hook accepts a `pause` option that
temporarily _freezes_ all changes and stops requests.

In the previous example we've defined a query with mandatory arguments. The `$from` and `$limit`
variables have been defined to be non-nullable `Int!` values.

Let's pause the query we've just
written to not execute when these variables are empty, to prevent `null` variables from being
executed. We can do this by means of setting the `pause` option to `true`:

```jsx
const Todos = ({ from, limit }) => {
  const [result, reexecuteQuery] = useQuery({
    query: TodosListQuery,
    variables: { from, limit },
    pause: !from || !limit,
  });

  // ...
};
```

Now whenever the mandatory `$from` or `$limit` variables aren't supplied the query won't be executed.
This also means that `result.data` won't change, which means we'll still have access to our old data
even though the variables may have changed.

### Request Policies

As has become clear in the previous sections of this page, the `useQuery` hook accepts more options
than just `query` and `variables`. Another option we should touch on is `requestPolicy`.

The `requestPolicy` option determines how results are retrieved from our `Client`'s cache. By
default this is set to `cache-first`, which means that we prefer to get results from our cache, but
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

Request policies aren't specific to `urql`'s React API, but are a common feature in its core. [You
can learn more about request policies on the API docs.](../api/core.md#requestpolicy)

### Reexecuting Queries

The `useQuery` hook updates and executes queries whenever its inputs, like the `query` or
`variables` change, but in some cases we may find that we need to programmatically trigger a new
query. This is the purpose of the `reexecuteQuery` function which is the second item in the tuple
that `useQuery` returns.

Triggering a query programmatically may be useful in a couple of cases. It can for instance be used
to refresh data that is currently being displayed. In these cases we may also override the
`requestPolicy` of our query just once and set it to `network-only` to skip the cache.

```jsx
const Todos = ({ from, limit }) => {
  const [result, reexecuteQuery] = useQuery({
    query: TodosListQuery,
    variables: { from, limit },
  });

  const refresh = () => {
    // Refetch the query and skip the cache
    reexecuteQuery({ requestPolicy: 'network-only' });
  };
};
```

Calling `refresh` in the above example will execute the query again forcefully, and will skip the
cache, since we're passing `requestPolicy: 'network-only'`.

Furthermore the `reexecuteQuery` function can also be used to programmatically start a query even
when `pause` is set to `true`, which would usually stop all automatic queries.

### Reading on

There are some more tricks we can use with `useQuery`. [Read more about its API in the API docs for
it.](../api/urql.md#usequery)

[On the next page we'll learn about "Mutations" rather than Queries.](./mutations.md#react--preact)

## Svelte

This guide covers how to query data with Svelte with our `Client` now fully set up and provided via
the Context API. We'll implement queries using the `operationStore` and the `query` function from
`@urql/svelte`.

The `operationStore` function creates a [Svelte Writable store](https://svelte.dev/docs#writable).
You can use it to initialise a data container in `urql`. This store holds on to our query inputs,
like the GraphQL query and variables, which we can change to launch new queries, and also exposes
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
    $todos.variables.from += $todos.variables.limit;
  }
</script>

<button on:click={nextPage}>Next page<button></button></button>
```

The `operationStore` provides getters too so it's also possible for us to pass `todos` around and
update `todos.variables` or `todos.query` directly. Both, updating `todos.variables` and
`$todos.variables` in a component for instance, will cause `query` to pick up the update and execute
our changes.

### Pausing Queries

In some cases we may want our queries to not execute until a pre-condition has been met. Since the
`query` operation exists for the entire component lifecycle however, it can't just be stopped and
started at will. Instead, the `query`'s third argument, the `context`, may have an added `pause`
option that can be set to `true` to temporarily _freeze_ all changes and stop requests.

For instance we may start out with a paused store and then unpause it once a callback is invoked:

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

  function nextPage() {
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
default this is set to `cache-first`, which means that we prefer to get results from our cache, but
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

As we can see, the `requestPolicy` is easily changed here and we can read our `context` option back
from `todos.context`, just as we can check `todos.query` and `todos.variables`. Updating
`operationStore.context` can be very useful to also refetch queries, as we'll see in the next
section.

[You can learn more about request policies on the API docs.](../api/core.md#requestpolicy)

### Reexecuting Queries

The default caching approach in `@urql/svelte` typically takes care of updating queries on the fly
quite well and does so automatically. Sometimes it may be necessary though to refetch data and to
execute a query with a different `context`. Triggering a query programmatically may be useful in a
couple of cases. It can for instance be used to refresh data that is currently being displayed.

We can trigger a new query update by changing out the `context` of our `operationStore`.

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
    $todos.context = { requestPolicy: 'network-only' };
  }
</script>
```

Calling `refresh` in the above example will execute the query again forcefully, and will skip the
cache, since we're passing `requestPolicy: 'network-only'`.

### Reading on

There are some more tricks we can use with `operationStore`.
[Read more about its API in the API docs for it.](../api/svelte.md#operationStore)

[On the next page we'll learn about "Mutations" rather than Queries.](./mutations.md#svelte)

## Vue

This guide covers how to query data with Vue with our `Client` now fully set up and provided to an
app. We'll implement queries using the `useQuery` function from `@urql/vue`.

### Run a first query

For the following examples, we'll imagine that we're querying data from a GraphQL API that contains
todo items. Let's dive right into it!

```jsx
<template>
  <div v-if="fetching">
    Loading...
  </div>
  <div v-else-if="error">
    Oh no... {{error}}
  </div>
  <div v-else>
    <ul v-if="data">
      <li v-for="todo in data.todos">{{ todo.title }}</li>
    </ul>
  </div>
</template>

<script>
import { useQuery } from '@urql/vue';

export default {
  setup() {
    const result = useQuery({
      query: `
        {
          todos {
            id
            title
          }
        }
      `
    });

    return {
      fetching: result.fetching,
      data: result.data,
      error: result.error,
    };
  }
};
</script>
```

Here we have implemented our first GraphQL query to fetch todos. We see that `useQuery` accepts
options and returns a tuple. In this case we've set the `query` option to our GraphQL query. The
tuple we then get in return is an array that contains a result object and a re-execute function.

The result object contains several properties. The `fetching` field indicates whether we're currently
loading data, `data` contains the actual `data` from the API's result, and `error` is set when either
the request to the API has failed or when our API result contained some `GraphQLError`s, which
we'll get into later on the ["Errors" page](./errors.md).

All of these properties on the result are derived from the [shape of
`OperationResult`](../api/core.md#operationresult) and are marked as reactive, which means they may
update while the query is running, which will automatically update your UI.

### Variables

Typically we'll also need to pass variables to our queries, for instance, if we are dealing with
pagination. For this purpose `useQuery` also accepts a `variables` input, which we can
use to supply variables to our query.

```jsx
<template>
  ...
</template>

<script>
import { useQuery } from '@urql/vue';

export default {
  props: ['from', 'limit'],
  setup({ from, limit }) {
    return useQuery({
      query: `
        query ($from: Int!, $limit: Int!) {
          todos(from: $from, limit: $limit) {
            id
            title
          }
        }
      `,
      variables: { from, limit }
    });
  }
};
</script>
```

As when we're sending GraphQL queries manually using `fetch`, the variables will be attached to the
`POST` request body that is sent to our GraphQL API.

All inputs that are passed to `useQuery` may also be [reactive
state](https://v3.vuejs.org/guide/reactivity-fundamentals.html). This means that both the inputs and
outputs of `useQuery` are reactive and may change over time.

```jsx
<template>
  <ul v-if="data">
    <li v-for="todo in data.todos">{{ todo.title }}</li>
  </ul>
  <button @click="from += 10">Next Page</button>
</template>

<script>
import { useQuery } from '@urql/vue';

export default {
  setup() {
    const from = ref(0);

    const result = useQuery({
      query: `
        query ($from: Int!, $limit: Int!) {
          todos(from: $from, limit: $limit) {
            id
            title
          }
        }
      `,
      variables: { from, limit: 10 }
    });

    return {
      from,
      data: result.data,
    };
  }
};
</script>
```

### Pausing `useQuery`

In some cases we may want `useQuery` to execute a query when a pre-condition has been met, and not
execute the query otherwise. For instance, we may be building a form and want a validation query to
only take place when a field has been filled out.

Since with Vue 3's Composition API we won't just conditionally call `useQuery` we can instead pass a
reactive `pause` input to `useQuery`.

In the previous example we've defined a query with mandatory arguments. The `$from` and `$limit`
variables have been defined to be non-nullable `Int!` values.

Let's pause the query we've just written to not execute when these variables are empty, to
prevent `null` variables from being executed. We can do this by computing `pause` to become `true`
whenever these variables are falsy:

```js
import { reactive } from 'vue'
import { useQuery } from '@urql/vue';

export default {
  props: ['from', 'limit'],
  setup({ from, limit }) {
    return useQuery({
      query: `
        query ($from: Int!, $limit: Int!) {
          todos(from: $from, limit: $limit) {
            id
            title
          }
        }
      `,
      variables: { from, limit },
      pause: computed(() => !from.value || !limit.value)
    });
  }
};
</script>
```

Now whenever the mandatory `$from` or `$limit` variables aren't supplied the query won't be executed.
This also means that `result.data` won't change, which means we'll still have access to our old data
even though the variables may have changed.

It's worth noting that depending on whether `from` and `limit` are reactive or not you may have to
change how `pause` is computed. But there's also an imperative alternative to this API. Not only
does the result you get back from `useQuery` have an `isPaused` ref, it also has `pause()` and
`resume()` methods.

```jsx
<template>
  <div v-if="fetching">
    Loading...
  </div>
  <button @click="isPaused ? resume() : pause()">Toggle Query</button>
</template>

<script>
import { useQuery } from '@urql/vue';

export default {
  setup() {
    return useQuery({
      query: `
        {
          todos {
            id
            title
          }
        }
      `
    });
  }
};
</script>
```

This means that no matter whether you're in or outside of `setup()` or rather supplying the inputs
to `useQuery` or using the outputs, you'll have access to ways to pause or unpause the query.

### Request Policies

As has become clear in the previous sections of this page, the `useQuery` hook accepts more options
than just `query` and `variables`. Another option we should touch on is `requestPolicy`.

The `requestPolicy` option determines how results are retrieved from our `Client`'s cache. By
default this is set to `cache-first`, which means that we prefer to get results from our cache, but
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

Request policies aren't specific to `urql`'s Vue bindings, but are a common feature in its core. [You
can learn more about request policies on the API docs.](../api/core.md#requestpolicy)

### Reexecuting Queries

The `useQuery` hook updates and executes queries whenever its inputs, like the `query` or
`variables` change, but in some cases we may find that we need to programmatically trigger a new
query. This is the purpose of the `executeQuery` method which is a method on the result object
that `useQuery` returns.

Triggering a query programmatically may be useful in a couple of cases. It can for instance be used
to refresh data that is currently being displayed. In these cases we may also override the
`requestPolicy` of our query just once and set it to `network-only` to skip the cache.

```js
import { useQuery } from '@urql/vue';

export default {
  setup() {
    const result = useQuery({
      query: `
        {
          todos {
            id
            title
          }
        }
      `
    });

    return {
      data: result.data,
      fetching: result.fetching,
      error: result.error,
      refresh() {
        result.executeQuery({
          requestPolicy: 'network-only'
        });
      }
    };
  }
};
</script>
```

Calling `refresh` in the above example will execute the query again forcefully, and will skip the
cache, since we're passing `requestPolicy: 'network-only'`.

Furthermore the `executeQuery` method can also be used to programmatically start a query even
when `pause` is `true`, which would usually stop all automatic queries.

### Reading on

There are some more tricks we can use with `useQuery`. [Read more about its API in the API docs for
it.](../api/vue.md#usequery)

[On the next page we'll learn about "Mutations" rather than Queries.](./mutations.md#vue)
