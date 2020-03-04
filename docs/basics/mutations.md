---
title: Mutations
order: 2
---

# Mutations

In this chapter we'll learn how to execute mutations and view their results.
Sending mutations to our GraphQL API is similar to what we've learned about sending queries to our
API [previously on the "Queries" page.](./queries.md)

## React & Preact

This guide covers how to query data with React and Preact, which share almost the same API.

Both libraries offer a `useMutation` hook and a `Mutation` component. The latter accepts the same
parameters but we won't cover it in this guide. [Look it up in the API docs if you prefer
render-props components.](../api/urql.md#components)

### Sending a mutation

Let's pick up an example in an imaginary todo items GraphQL API and dive into an example!
We'll set up a mutation that _updates_ a todo item.

```jsx
const UpdateTodo = `
  mutation ($id: ID!, $title: String!) {
    updateTodo (id: $id, title: $title) {
      id
    }
  }
`;

const Todo = ({ id, title }) => {
  const [updateTodoResult, updateTodo] = useMutation(UpdateTodo);
};
```

Similar to the `useQuery` output, `useMutation` returns a tuple. The first item in the tuple again
contains `fetching`, `error`, and `data` — it's identical since this is a common pattern of how
`urql` presents _operation results_.

Unlike the `useQuery` hook, the `useMutation` hook doesn't execute automatically. At this point in
our example, no mutation will be performed. To execute our mutation we instead have to call the
execute function — `updateTodo` in our example — which is the second item in the tuple.

### Using the mutation result

When calling our `updateTodo` function we have two ways of getting to the result as it comes back
from our API. We can either use the first value of the returned tuple — our `updateTodoResult` — or
we can use the promise that `updateTodo` returns.

```jsx
const Todo = ({ id, title }) => {
  const [updateTodoResult, updateTodo] = useMutation(UpdateTodo);

  const submit = newTitle => {
    const variables = { id, title: newTitle || '' };
    updateTodo(variables).then(result => {
      // The result is almost identical to `updateTodoResult` with the exception
      // of `result.fetching` not being set.
    });
  };
};
```

This is useful when your UI has to display progress or results on the mutation, and the returned
promise is particularly useful when you're adding side-effects that run after the mutation has
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

### Reading on

There are some more tricks we can use with `useMutation`. [Read more about its API in the API docs for
it.](../api/urql.md#usemutation)

[On the next page we'll learn about "Document Caching", `urql`'s default caching
mechanism.](./document-caching.md)
