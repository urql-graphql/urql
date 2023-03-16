---
title: React/Preact Bindings
order: 0
---

# React/Preact

This guide covers how to install and setup `urql` and the `Client`, as well as query and mutate data,
with React and Preact. Since the `urql` and `@urql/preact` packages share most of their API and are
used in the same way, when reading the documentation on React, all examples are essentially the same,
except that we'd want to use the `@urql/preact` package instead of the `urql` package.

## Getting started

### Installation

Installing `urql` is as quick as you'd expect, and you won't need any other packages to get started
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
import { createClient, dedupExchange, cacheExchange, fetchExchange } from 'urql';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [dedupExchange, cacheExchange, fetchExchange],
});
```

At the bare minimum we'll need to pass an API's `url` when we create a `Client` to get started.

Another common option is `fetchOptions`. This option allows us to customize the options that will be
passed to `fetch` when a request is sent to the given API `url`. We may pass in an options object, or
a function returning an options object.

In the following example we'll add a token to each `fetch` request that our `Client` sends to our
GraphQL API.

```js
const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [dedupExchange, cacheExchange, fetchExchange],
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
import { createClient, Provider, dedupExchange, cacheExchange, fetchExchange } from 'urql';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [dedupExchange, cacheExchange, fetchExchange],
});

const App = () => (
  <Provider value={client}>
    <YourRoutes />
  </Provider>
);
```

Now every component and element inside and under the `Provider` can use GraphQL queries that
will be sent to our API.

## Queries

Both libraries offer a `useQuery` hook and a `Query` component. The latter accepts the same
parameters, but we won't cover it in this guide. [Look it up in the API docs if you prefer
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
tuple we then get in return is an array that contains a result object, and a re-execute function.

The result object contains several properties. The `fetching` field indicates whether the hook is
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
switch to `true`, and a new request will be sent to our API, unless a result has already been cached
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
executed. We can do this by setting the `pause` option to `true`:

```jsx
const Todos = ({ from, limit }) => {
  const shouldPause = from === undefined || from === null ||
                      limit === undefined || limit === null;
  const [result, reexecuteQuery] = useQuery({
    query: TodosListQuery,
    variables: { from, limit },
    pause: shouldPause,
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
default, this is set to `cache-first`, which means that we prefer to get results from our cache, but
are falling back to sending an API request.

Request policies aren't specific to `urql`'s React API, but are a common feature in its core. [You
can learn more about how the cache behaves given the four different policies on the "Document
Caching" page.](../basics/document-caching.md)

```jsx
const [result, reexecuteQuery] = useQuery({
  query: TodosListQuery,
  variables: { from, limit },
  requestPolicy: 'cache-and-network',
});
```

Specifically, a new request policy may be passed directly to the `useQuery` hook as an option.
This policy is then used for this specific query. In this case, `cache-and-network` is used and
the query will be refreshed from our API even after our cache has given us a cached result.

Internally, the `requestPolicy` is just one of several "**context** options". The `context`
provides metadata apart from the usual `query` and `variables` we may pass. This means that
we may also change the `Client`'s default `requestPolicy` by passing it there.

```js
import { createClient } from 'urql';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [dedupExchange, cacheExchange, fetchExchange],
  // every operation will by default use cache-and-network rather
  // than cache-first now:
  requestPolicy: 'cache-and-network',
});
```

### Context Options

As mentioned, the `requestPolicy` option on `useQuery` is a part of `urql`'s context options.
In fact, there are several more built-in context options, and the `requestPolicy` option is
one of them. Another option we've already seen is the `url` option, which determines our
API's URL. These options aren't limited to the `Client` and may also be passed per query.

```jsx
import { useMemo } from 'react';
import { useQuery } from 'urql';

const Todos = ({ from, limit }) => {
  const [result, reexecuteQuery] = useQuery({
    query: TodosListQuery,
    variables: { from, limit },
    context: useMemo(
      () => ({
        requestPolicy: 'cache-and-network',
        url: 'http://localhost:3000/graphql?debug=true',
      }),
      []
    ),
  });

  // ...
};
```

As we can see, the `context` property for `useQuery` accepts any known `context` option and can be
used to alter them per query rather than globally. The `Client` accepts a subset of `context`
options, while the `useQuery` option does the same for a single query.
[You can find a list of all `Context` options in the API docs.](../api/core.md#operationcontext)

### Reexecuting Queries

The `useQuery` hook updates and executes queries whenever its inputs, like the `query` or
`variables` change, but in some cases we may find that we need to programmatically trigger a new
query. This is the purpose of the `reexecuteQuery` function, which is the second item in the tuple
that `useQuery` returns.

Triggering a query programmatically may be useful in a couple of cases. It can for instance be used
to refresh the hook's data. In these cases we may also override the `requestPolicy` of our query just
once and set it to `network-only` to skip the cache.

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
when `pause` is set to `true`, which would usually stop all automatic queries. This can be used to
perform one-off actions, or to set up polling.

```jsx
import { useEffect } from 'react';
import { useQuery } from 'urql';

const Todos = ({ from, limit }) => {
  const [result, reexecuteQuery] = useQuery({
    query: TodosListQuery,
    variables: { from, limit },
    pause: true,
  });

  useEffect(() => {
    if (result.fetching) return;

    // Set up to refetch in one second, if the query is idle
    const timerId = setTimeout(() => {
      reexecuteQuery({ requestPolicy: 'network-only' });
    }, 1000);

    return () => clearTimeout(timerId);
  }, [result.fetching, reexecuteQuery]);

  // ...
};
```

There are some more tricks we can use with `useQuery`. [Read more about its API in the API docs for
it.](../api/urql.md#usequery)

## Mutations

Both libraries offer a `useMutation` hook and a `Mutation` component. The latter accepts the same
parameters, but we won't cover it in this guide. [Look it up in the API docs if you prefer
render-props components.](../api/urql.md#mutation-component)

### Sending a mutation

Let's again pick up an example with an imaginary GraphQL API for todo items, and dive into an
example! We'll set up a mutation that _updates_ a todo item's title.

```jsx
const UpdateTodo = `
  mutation ($id: ID!, $title: String!) {
    updateTodo (id: $id, title: $title) {
      id
      title
    }
  }
`;

const Todo = ({ id, title }) => {
  const [updateTodoResult, updateTodo] = useMutation(UpdateTodo);
};
```

Similar to the `useQuery` output, `useMutation` returns a tuple. The first item in the tuple again
contains `fetching`, `error`, and `data` — it's identical since this is a common pattern of how
`urql` presents [operation results](../api/core.md#operationresult).

Unlike the `useQuery` hook, the `useMutation` hook doesn't execute automatically. At this point in
our example, no mutation will be performed. To execute our mutation we instead have to call the
execute function — `updateTodo` in our example — which is the second item in the tuple.

### Using the mutation result

When calling our `updateTodo` function we have two ways of getting to the result as it comes back
from our API. We can either use the first value of the returned tuple, our `updateTodoResult`, or
we can use the promise that `updateTodo` returns.

```jsx
const Todo = ({ id, title }) => {
  const [updateTodoResult, updateTodo] = useMutation(UpdateTodo);

  const submit = newTitle => {
    const variables = { id, title: newTitle || '' };
    updateTodo(variables).then(result => {
      // The result is almost identical to `updateTodoResult` with the exception
      // of `result.fetching` not being set.
      // It is an OperationResult.
    });
  };
};
```

The result is useful when your UI has to display progress on the mutation, and the returned
promise is particularly useful when you're adding side effects that run after the mutation has
completed.

### Handling mutation errors

It's worth noting that the promise we receive when calling the execute function will never
reject. Instead it will always return a promise that resolves to a result.

If you're checking for errors, you should use `result.error` instead, which will be set
to a `CombinedError` when any kind of errors occurred while executing your mutation.
[Read more about errors on our "Errors" page.](./errors.md)

```jsx
const Todo = ({ id, title }) => {
  const [updateTodoResult, updateTodo] = useMutation(UpdateTodo);

  const submit = newTitle => {
    const variables = { id, title: newTitle || '' };
    updateTodo(variables).then(result => {
      if (result.error) {
        console.error('Oh no!', result.error);
      }
    });
  };
};
```

There are some more tricks we can use with `useMutation`.<br />
[Read more about its API in the API docs for it.](../api/urql.md#usemutation)

## Reading on

This concludes the introduction for using `urql` with React or Preact. The rest of the documentation
is mostly framework-agnostic and will apply to either `urql` in general, or the `@urql/core` package,
which is the same between all framework bindings. Hence, next we may want to learn more about one of
the following to learn more about the internals:

- [How does the default "document cache" work?](./document-caching.md)
- [How are errors handled and represented?](./errors.md)
- [A quick overview of `urql`'s architecture and structure.](../architecture.md)
- [Setting up other features, like authentication, uploads, or persisted queries.](../advanced/README.md)
