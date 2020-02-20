---
title: mutating-data
order: 2
---

## (P)React

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

Similar to the `useQuery` output we see a tuple, the first being our result
again with `fetching`, `error` and `data`. At this point in time the mutation
hasn't done anything but return you this tuple, to mutate the data we have to call
the function here named `updateTodo`.

When calling this function we have two ways of getting the response from the server,
we can get it from `updateTodoResult` or we chain a `.then` on our `updateTodo` call.

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
