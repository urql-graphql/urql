<script>
  import { createSvelteClient, query } from '../../dist/es';
  let i = 0;
  const client = createSvelteClient({ url: "https://0ufyz.sse.codesandbox.io" });

  $: getTodos = query({
    query: `
      query {
        todos {
          id
          text
          complete
        }
      }
    `, variables: { i },
  });
  const increment = () => i = i + 1;
</script>

{#await $getTodos}
Loading...
{:then result}
  {#each result.data.todos as todo}
    <p>{todo.text}</p>
  {/each}
{:catch error}
  Error: {error}
{/await}
<button on:click={increment}>Increment {i}</button>
