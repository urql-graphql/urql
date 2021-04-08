---
'@urql/svelte': minor
---

Allow to pass a client directly to `query`, `subscription` and `mutation`.

This change supports the use of the svelte bindings outside of a component.

For example with @sveltejs/kit it is possible to use the [load](https://kit.svelte.dev/docs#loading) method to get data before the component is initialized:

```html
<script context="module">
  import { get } from 'svelte/store';
  import { operationStore, query } from '@urql/svelte';

  export async function load({ context: { client } }) {
    const todos = query(
      operationStore(`
      query {
        todos {
          id
          title
        }
      }
    `),
      context.client
    );

    // Load the todos and make them available during initial rendering
    await todos.toPromise();

    return { props: { todos } };
  }
</script>

<script>
  export const todos

  // No need to invoke query(result)
</script>
```
