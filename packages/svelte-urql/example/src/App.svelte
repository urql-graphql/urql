<script>
  import { initClient, operationStore, query } from '../..';

  initClient({ url: "https://0ufyz.sse.codesandbox.io" });

  const todos = operationStore(`
    query {
      todos {
        id
        text
        complete
      }
    }
  `);

  query(todos);
</script>

{#if $todos.fetching}
  Loading...
{:else if $todos.error}
  Oh no! {$todos.error.message}
{:else if !$todos.data}
  No data
{:else}
  <ul>
    {#each $todos.data.todos as todo}
      <li>{todo.text}</li>
    {/each}
  </ul>
{/if}
