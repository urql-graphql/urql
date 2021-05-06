<script>
  import { gql, operationStore, query } from "@urql/svelte";

  const pokemons = operationStore(
    gql`
      query ($skip: Int!) {
        pokemons(limit: 10, skip: $skip) {
          id
          name
        }
      }
    `,
    { skip: 0 }
  );

  query(pokemons);

  function nextPage() {
    $pokemons.variables = { skip: $pokemons.variables.skip + 10 };
  }
</script>

<div>
  {#if $pokemons.fetching}
    Loading...
  {:else if $pokemons.error}
    Oh no... {$pokemons.error.message}
  {:else}
    <ul>
      {#each $pokemons.data.pokemons as pokemon}
        <li>{pokemon.name}</li>
      {/each}
    </ul>
  {/if}
  <button on:click={nextPage}>Next Page</button>
</div>
