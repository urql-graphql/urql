<script>
  import { initClient, query } from '../..';

  initClient({ url: "https://0ufyz.sse.codesandbox.io" });

  let i = 0;

  $: todos = query({
    query: `
      query {
        todos {
          id
          text
          complete
        }
      }
    `,
    variables: { i },
  });

  const increment = () => i = i + 1;
</script>

{#if $todos.fetching}
  Loading...
{:else if $todos.error}
  Oh no! {$todos.error.message}
{:else}
  <ul>
    {#each $todos.data.todos as todo}
      <li>{todo.text}</li>
    {/each}
  </ul>
{/if}

<button on:click={increment}>Increment {i}</button>
