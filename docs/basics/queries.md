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
render-props components.](../api/urql.md#components)

### Run a first query

For the following examples imagine we are querying data from a GraphQL API that contains todo items
Let's dive right into an example!

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

Here we have implemented our first GraphQL query to fetch todos. We see that using `useQuery`
accepts options — in this case we've set `query` to our GraphQL query — and returns a tuple — an
array that contains a result and a reexecute function.

The result contains several properties. The `fetching` field indicates whether we're currently loading
data, `data` contains the actual `data` from the API's result, and `error` is set when either the
request to the API has failed or when our result contained some `GraphQLError`s, which
we'll get into later on the ["Errors" page](./errors.md).

### Variables

Typically we'll also need to pass variables to our queries, for instance What if we are dealing with
pagination? For this purpose the `useQuery` hook also accepts a `variables` option, which we can use
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
`POST` request that is sent to our GraphQL API.

Whenever the `variables` (or the `query`) option on
the `useQuery` hook changes `fetching` will return to being `true` and a new request will be sent to
our API, unless a result has already been cached previously.

### Pausing `useQuery`

In some cases we may want `useQuery` to execute a query when a precondition has been met. For
instance, we may be building a form and want validation to only take place when a field has been
filled out.

In the previous example we've defined a query with mandatory arguments. The `$from` and `$limit`
variables have been defined to be non-nullable `Int!` values.

Let's pause the query we've just
written to not execute when these variables are empty, to prevent `null` variables from being
executed. We can do this by means of the `pause` option.

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

[On the next page we'll learn about "Mutations" rather than Queries.](./mutations.md)
