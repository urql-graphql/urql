<script>
  import { getContextClient, gql, queryStore } from "@urql/svelte";

  let skip = 0;
  $: pokemons = queryStore({
    client: getContextClient(),
    query: gql`
      query ($skip: Int!) {
        pokemons(limit: 10, skip: $skip) {
          id
          name
        }
      }
    `,
    variables: { skip },
    requestPolicy: 'cache-and-network'
  });

  function nextPage() {
    skip = skip + 10;
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
