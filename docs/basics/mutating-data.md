---
title: Mutations
order: 2
---

## Mutate your data

Now that we know how to query our data we'll also need to know
how to mutate it, for this the `useMutation` hook and the `Mutation`
component are exported.

Let's set up a mutation allowing us to change the name of our todo.

```jsx
const Todo = ({ id, title }) => {
  const [updateTodoResult, updateTodo] = useMutation(`
    mutation ($id: ID!, $title: String!) {
      updateTodo (id: $id, title: $title) {
        id
      }
    }
  `);
}
```

Similar to the `useQuery` output, `useMutation` returns a tuple. The first item in the tuple being our `result`
containing: `fetching`, `error`, and `data`. At this point in time, no mutation has been performed.
To mutate the data we first have to invoke the second item in the tuple - the function here named `updateTodo`.

### Using the result

When calling this function we have two ways of getting the response from the server,
we can get it from `updateTodoResult` or we can await the promise returned from our mutation trigger function.

```jsx
const Todo = ({ id, title }) => {
  const [updateTodoResult, updateTodo] = useMutation(`
    mutation ($id: ID!, $title: String!) {
      updateTodo (id: $id, title: $title) {
        id
      }
    }
  `);

  const submit = (newTitle) => {
    updateTodo({ variables: { id, title: newTitle } }).then((data) => {
      // this data variable will be the same as updateTodoResult.data
    });
  }
}
```

This means that we can react to a completed todo in the body of the `.then` or
with a `useEffect`.
