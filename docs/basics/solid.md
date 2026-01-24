---
title: Solid Bindings
order: 3
---

# Solid

This guide covers how to install and setup `@urql/solid` and the `Client`, as well as query and mutate data with Solid. The `@urql/solid` package provides reactive primitives that integrate seamlessly with Solid's fine-grained reactivity system.

> **Note:** This guide is for client-side SolidJS applications. If you're building a SolidStart application with SSR, see the [SolidStart guide](./solid-start.md) instead. The packages use different APIs optimized for their respective use cases.

## Getting started

### Installation

Installing `@urql/solid` is quick and you won't need any other packages to get started with at first. We'll install the package with our package manager of choice.

```sh
yarn add @urql/solid graphql
# or
npm install --save @urql/solid graphql
# or
pnpm add @urql/solid graphql
```

Most libraries related to GraphQL also need the `graphql` package to be installed as a peer dependency, so that they can adapt to your specific versioning requirements. That's why we'll need to install `graphql` alongside `@urql/solid`.

Both the `@urql/solid` and `graphql` packages follow [semantic versioning](https://semver.org) and all `@urql/solid` packages will define a range of compatible versions of `graphql`. Watch out for breaking changes in the future however, in which case your package manager may warn you about `graphql` being out of the defined peer dependency range.

### Setting up the `Client`

The `@urql/solid` package exports a `Client` class from `@urql/core`, which we can use to create the GraphQL client. This central `Client` manages all of our GraphQL requests and results.

```js
import { createClient, cacheExchange, fetchExchange } from '@urql/solid';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
});
```

At the bare minimum we'll need to pass an API's `url` and `exchanges` when we create a `Client` to get started.

Another common option is `fetchOptions`. This option allows us to customize the options that will be passed to `fetch` when a request is sent to the given API `url`. We may pass in an options object, or a function returning an options object.

In the following example we'll add a token to each `fetch` request that our `Client` sends to our GraphQL API.

```js
const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    const token = getToken();
    return {
      headers: { authorization: token ? `Bearer ${token}` : '' },
    };
  },
});
```

### Providing the `Client`

To make use of the `Client` in Solid we will have to provide it via Solid's Context API. This may be done with the help of the `Provider` export.

```jsx
import { render } from 'solid-js/web';
import { createClient, Provider, cacheExchange, fetchExchange } from '@urql/solid';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
});

const App = () => (
  <Provider value={client}>
    <YourRoutes />
  </Provider>
);

render(() => <App />, document.getElementById('root'));
```

Now every component inside and under the `Provider` can use GraphQL queries that will be sent to our API.

## Queries

The `@urql/solid` package offers a `createQuery` primitive that integrates with Solid's fine-grained reactivity system.

### Run a first query

For the following examples, we'll imagine that we're querying data from a GraphQL API that contains todo items. Let's dive right into it!

```jsx
import { Suspense, For } from 'solid-js';
import { gql } from '@urql/core';
import { createQuery } from '@urql/solid';

const TodosQuery = gql`
  query {
    todos {
      id
      title
    }
  }
`;

const Todos = () => {
  const [result] = createQuery({
    query: TodosQuery,
  });

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ul>
        <For each={result().data.todos}>
          {(todo) => <li>{todo.title}</li>}
        </For>
      </ul>
    </Suspense>
  );
};
```

Here we have implemented our first GraphQL query to fetch todos. We see that `createQuery` accepts options and returns a tuple. In this case we've set the `query` option to our GraphQL query. The tuple we then get in return is an array where the first item is an accessor function that returns the result object.

The result object contains several properties. The `fetching` field indicates whether the query is loading data, `data` contains the actual `data` from the API's result, and `error` is set when either the request to the API has failed or when our API result contained some `GraphQLError`s, which we'll get into later on the ["Errors" page](./errors.md).

### Variables

Typically we'll also need to pass variables to our queries, for instance, if we are dealing with pagination. For this purpose `createQuery` also accepts a `variables` option, which can be reactive.

```jsx
const TodosListQuery = gql`
  query ($from: Int!, $limit: Int!) {
    todos(from: $from, limit: $limit) {
      id
      title
    }
  }
`;

const Todos = (props) => {
  const [result] = createQuery({
    query: TodosListQuery,
    variables: () => ({ from: props.from, limit: props.limit }),
  });

  // ...
};
```

The `variables` option can be passed as a static object or as an accessor function that returns the variables. When using an accessor, the query will automatically re-execute when the variables change.

```jsx
import { Suspense, For, createSignal } from 'solid-js';
import { gql } from '@urql/core';
import { createQuery } from '@urql/solid';

const TodosListQuery = gql`
  query ($from: Int!, $limit: Int!) {
    todos(from: $from, limit: $limit) {
      id
      title
    }
  }
`;

const Todos = () => {
  const [from, setFrom] = createSignal(0);
  const limit = 10;

  const [result] = createQuery({
    query: TodosListQuery,
    variables: () => ({ from: from(), limit }),
  });

  return (
    <div>
      <Suspense fallback={<p>Loading...</p>}>
        <ul>
          <For each={result().data.todos}>
            {(todo) => <li>{todo.title}</li>}
          </For>
        </ul>
      </Suspense>
      <button onClick={() => setFrom(f => f + 10)}>Next Page</button>
    </div>
  );
};
```

Whenever the variables change, `fetching` will switch to `true`, and a new request will be sent to our API, unless a result has already been cached previously.

### Pausing `createQuery`

In some cases we may want `createQuery` to execute a query when a pre-condition has been met, and not execute the query otherwise. For instance, we may be building a form and want a validation query to only take place when a field has been filled out.

The `createQuery` primitive accepts a `pause` option that temporarily stops the query from executing.

```jsx
const Todos = (props) => {
  const shouldPause = () => props.from == null || props.limit == null;
  
  const [result] = createQuery({
    query: TodosListQuery,
    variables: () => ({ from: props.from, limit: props.limit }),
    pause: shouldPause,
  });

  // ...
};
```

Now whenever the mandatory variables aren't supplied the query won't be executed. This also means that `result().data` won't change, which means we'll still have access to our old data even though the variables may have changed.

### Request Policies

The `createQuery` primitive accepts a `requestPolicy` option that determines how results are retrieved from our `Client`'s cache. By default, this is set to `cache-first`, which means that we prefer to get results from our cache, but are falling back to sending an API request.

Request policies aren't specific to `@urql/solid`, but are a common feature in urql's core. [You can learn more about how the cache behaves given the four different policies on the "Document Caching" page.](./document-caching.md)

```jsx
const [result] = createQuery({
  query: TodosListQuery,
  variables: () => ({ from: props.from, limit: props.limit }),
  requestPolicy: 'cache-and-network',
});
```

The `requestPolicy` can be passed as a static string or as an accessor function. When using `cache-and-network`, the query will be refreshed from our API even after our cache has given us a cached result.

### Context Options

The `requestPolicy` option is part of urql's context options. In fact, there are several more built-in context options. These options can be passed via the `context` parameter.

```jsx
const [result] = createQuery({
  query: TodosListQuery,
  variables: () => ({ from: props.from, limit: props.limit }),
  context: () => ({
    requestPolicy: 'cache-and-network',
    url: 'http://localhost:3000/graphql?debug=true',
  }),
});
```

[You can find a list of all `Context` options in the API docs.](../api/core.md#operationcontext)

### Reexecuting Queries

The `createQuery` primitive updates and executes queries automatically when reactive inputs change, but in some cases we may need to programmatically trigger a new query. This is the purpose of the second item in the tuple that `createQuery` returns.

```jsx
const Todos = () => {
  const [result, reexecuteQuery] = createQuery({
    query: TodosListQuery,
    variables: { from: 0, limit: 10 },
  });

  const refresh = () => {
    // Refetch the query and skip the cache
    reexecuteQuery({ requestPolicy: 'network-only' });
  };

  return (
    <div>
      <Suspense fallback={<p>Loading...</p>}>
        <ul>
          <For each={result().data.todos}>
            {(todo) => <li>{todo.title}</li>}
          </For>
        </ul>
      </Suspense>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
};
```

Calling `refresh` in the above example will execute the query again forcefully, and will skip the cache, since we're passing `requestPolicy: 'network-only'`.

## Mutations

The `@urql/solid` package offers a `createMutation` primitive for executing GraphQL mutations.

### Sending a mutation

Let's again pick up an example with an imaginary GraphQL API for todo items. We'll set up a mutation that updates a todo item's title.

```jsx
import { gql } from '@urql/core';
import { createMutation } from '@urql/solid';

const UpdateTodo = gql`
  mutation ($id: ID!, $title: String!) {
    updateTodo (id: $id, title: $title) {
      id
      title
    }
  }
`;

const Todo = (props) => {
  const [result, updateTodo] = createMutation(UpdateTodo);

  const handleSubmit = (newTitle) => {
    updateTodo({ id: props.id, title: newTitle });
  };

  return (
    <div>
      <Show when={result().fetching}>
        <p>Updating...</p>
      </Show>
      <Show when={result().error}>
        <p>Error: {result().error.message}</p>
      </Show>
      {/* Your form UI here */}
    </div>
  );
};
```

Similar to `createQuery`, `createMutation` returns a tuple. The first item is an accessor that returns the result object containing `fetching`, `error`, and `data` — identical to query results. The second item is the execute function that triggers the mutation.

Unlike `createQuery`, `createMutation` doesn't execute automatically. We must call the execute function with the mutation variables.

### Using the mutation result

The mutation result is available both through the reactive accessor and through the promise returned by the execute function.

```jsx
const Todo = (props) => {
  const [result, updateTodo] = createMutation(UpdateTodo);

  const handleSubmit = (newTitle) => {
    const variables = { id: props.id, title: newTitle };
    
    updateTodo(variables).then((result) => {
      // The result is almost identical to result() from the accessor
      // It is an OperationResult.
      if (!result.error) {
        console.log('Todo updated!', result.data);
      }
    });
  };

  return (
    <div>
      <Show when={result().fetching}>
        <p>Updating...</p>
      </Show>
      {/* Your form UI here */}
    </div>
  );
};
```

The reactive accessor is useful when your UI needs to display progress on the mutation, and the returned promise is particularly useful for side effects that run after the mutation completes.

### Handling mutation errors

The promise returned by the execute function will never reject. Instead it will always return a promise that resolves to a result.

If you're checking for errors, you should use `result.error`, which will be set to a `CombinedError` when any kind of errors occurred while executing your mutation. [Read more about errors on our "Errors" page.](./errors.md)

```jsx
const Todo = (props) => {
  const [result, updateTodo] = createMutation(UpdateTodo);

  const handleSubmit = (newTitle) => {
    const variables = { id: props.id, title: newTitle };
    
    updateTodo(variables).then((result) => {
      if (result.error) {
        console.error('Oh no!', result.error);
      }
    });
  };

  // ...
};
```

## Subscriptions

The `@urql/solid` package offers a `createSubscription` primitive for handling GraphQL subscriptions with Solid's reactive system.

### Setting up a subscription

GraphQL subscriptions allow you to receive real-time updates from your GraphQL API. Here's an example of how to set up a subscription:

```jsx
import { gql } from '@urql/core';
import { createSubscription } from '@urql/solid';

const NewTodos = gql`
  subscription {
    newTodos {
      id
      title
    }
  }
`;

const TodoSubscription = () => {
  const [result] = createSubscription({
    query: NewTodos,
  });

  return (
    <div>
      <Show when={result().fetching}>
        <p>Waiting for updates...</p>
      </Show>
      <Show when={result().error}>
        <p>Error: {result().error.message}</p>
      </Show>
      <Show when={result().data}>
        <p>New todo: {result().data.newTodos.title}</p>
      </Show>
    </div>
  );
};
```

### Handling subscription data

Unlike queries and mutations, subscriptions can emit multiple results over time. You can use a `handler` function to accumulate or process subscription events:

```jsx
import { createSignal } from 'solid-js';

const TodoSubscription = () => {
  const [todos, setTodos] = createSignal([]);

  const handleSubscription = (previousData, newData) => {
    setTodos(current => [...current, newData.newTodos]);
    return newData;
  };

  const [result] = createSubscription(
    {
      query: NewTodos,
    },
    handleSubscription
  );

  return (
    <ul>
      <For each={todos()}>
        {(todo) => <li>{todo.title}</li>}
      </For>
    </ul>
  );
};
```

The handler function receives the previous data and the new data from the subscription, allowing you to accumulate results or transform them as needed.

## Reading on

This concludes the introduction for using `@urql/solid` with Solid. The rest of the documentation is mostly framework-agnostic and will apply to either `urql` in general, or the `@urql/core` package, which is the same between all framework bindings. Hence, next we may want to learn more about one of the following:

- [How does the default "document cache" work?](./document-caching.md)
- [How are errors handled and represented?](./errors.md)
- [A quick overview of `urql`'s architecture and structure.](../architecture.md)
- [Setting up other features, like authentication, uploads, or persisted queries.](../advanced/README.md)
