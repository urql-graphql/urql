<script>
  import { setContextClient, createClient } from "@urql/svelte";
  import PokemonList from "./PokemonList.svelte";

  setContextClient(createClient({
    url: "https://trygql.formidable.dev/graphql/basic-pokedex"
  }));
</script>

<PokemonList />
