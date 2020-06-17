<script>
  import { initClient, query } from '../..';

  initClient({ url: "https://0ufyz.sse.codesandbox.io" });

  let i = 0;

  const todosQuery = query({
    query: `
      query {
        todos {
          id
          text
          complete
        }
      }
    `,
  });

  $: todos = todosQuery({ pause: true });

  const execute = () => todosQuery().then();
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

<button on:click={execute}>Execute</button>
