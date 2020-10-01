---
title: Mutations
order: 2
---

# Mutations

In this chapter we'll learn how to execute mutations and view their results.
Sending mutations to our GraphQL API is similar to what we've learned about sending queries to our
API [previously on the "Queries" page.](./queries.md)

## React & Preact

This guide covers how to send mutations in React and Preact, which share almost the same API.

Both libraries offer a `useMutation` hook and a `Mutation` component. The latter accepts the same
parameters but we won't cover it in this guide. [Look it up in the API docs if you prefer
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

## Svelte

This guide covers how to send mutations in Svelte using `@urql/svelte`'s `mutation` utility.
The `mutation` function isn't dissimilar from the `query` function but is triggered manually and
can accept a [`GraphQLRequest` object](../api/core.md#graphqlrequest) too while also supporting our
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

[On the next page we'll learn about "Document Caching", `urql`'s default caching
mechanism.](./document-caching.md)
