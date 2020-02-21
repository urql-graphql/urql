---
title: Queries
order: 1
---

# Queries

Let's get to querying our data! This section will teach us how we can
retrieve our data from the server with the help of `urql`.

## React/Preact

Let's get to querying our first piece of data, we offer both a
`render-props` component named `Query` and a hook named `useQuery` as
a means to query data.

The examples will show the hooks-version but it will be the same for the component.

### Run your first query

For the following examples imagine we are querying a server offering us todo's, let's
dive right into it!

```jsx
const Todos = () => {
  const [{ data, fetching, error }, reexecuteFetch] = useQuery({
    query: `
      query {
        todos {
          id
          title
        }
      }
    `,
  });

  if (fetching) return <p>Loading...</p>
  if (error) return <p>Oh no... {error.message}</p>
  
  return (
    <ul>
      {data.todos.map(todo => (
        <li key={todo.id}>
          {todo.title}
        </li>
      ))}
    </ul>
  );
}
```

### Variables

We have fetched our first set of todos. We can see the `useQuery` hook returns a tuple,
the first being the result indicating whether it's fetching, it has errored and the result.
The second can be used to refetch the query forcefully.

What if we are dealing with pagination? We'd need a way to pass that right?
We have the `variables` property to supply the variables to our query.

```jsx
const Todos = ({ from, limit }) => {
  const [{ data, fetching, error }, reexecuteFetch] = useQuery({
    query: `
      query ($from: Int!, $limit: Int!) {
        todos (from: $from, limit: $limit) {
          id
          title
        }
      }
    `,
    variables: { from, limit },
  });
  ...
}
```

### Skipping queries

As you can see we are enforcing `from` and `limit` as mandatory (notice the "!" after the `Int` type)
this means that if we don't supply them this query will fail, we need some way of pausing this query
when we don't have these. We can do exactly this by means of the `skip` property.

```jsx
const Todos = ({ from, limit }) => {
  const [{ data, fetching, error }, reexecuteFetch] = useQuery({
    ...
    skip: (!from || !limit)
  });
  ...
}
```

Now whenever one of these two mandatory variables isn't supplied the query won't be executed.

### Request policy

We're almost there, there's one last thing we should touch on and that's the `requestPolicy`,
this property tells the client how you want to get the result for your query, there are four values:

- `cache-first` (default), this means we want to first look in our cache and see if the result is there, if not
  we fetch it and update our cache with the result.
- `cache-and-network`, here we'll go to the cache and see if there's a result if there's not we fetch it, if there
  is a result we return it to the `query` and dispatch another operation to refresh this data.
- `network-only`, this policy bypasses the cache and will just query your server.
- `cache-only`, here we'll look for your data in the cache, if it's there you'll get the data returned, if not
  there will be a `null` return.
