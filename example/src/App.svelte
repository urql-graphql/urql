<script>
  import { createSvelteClient, mutate, query } from '../../dist/es';
  console.log(query);
  const client = createSvelteClient({ url: "https://0ufyz.sse.codesandbox.io" });
  const toggleTodo = mutate(`
    mutation($id: ID!) {
      toggleTodo(id: $id) {
        id
      }
    }
  `);

  const getTodos = query({
    query: `
      query {
        todos {
          id
          text
          complete
        }
      }
    `
  })
</script>

<div>
  <h1>Hello urql!</h1>
  <button on:click={() => {
    console.log('toggling');
    toggleTodo({ id: 0 }).then(console.log).catch(console.error)
  }}>Toggle</button>
</div>
{#await $getTodos}
Loading...
{:then result}
  {#each result.data.todos as todo}
    <p>{todo.text}</p>
  {/each}
{:catch error}
  Error: {error}
{/await}
