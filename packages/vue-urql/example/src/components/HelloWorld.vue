<template>
  <div>
    <div v-if="pokemons">
      <pre>{{ JSON.stringify(pokemons) }}</pre>
    </div>
    <div v-if="pokemon">
      <pre>{{ JSON.stringify(pokemon) }}</pre>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { gql, useClientHandle } from '@urql/vue';

export default {
  async setup() {
    const handle = useClientHandle();

    const pokemons = await handle.useQuery({
      query: gql`
        {
          pokemons(limit: 10) {
            id
            name
          }
        }
      `
    });

    const pokemon = await handle.useQuery({
      query: gql`
        query ($id: ID!) {
          pokemon(id: $id) {
            id
            name
          }
        }
      `,
      variables: {
        id: pokemons.data.value.pokemons[0].id,
      },
    });

    return {
      pokemons: pokemons.data,
      pokemon: pokemon.data
    };
  },
  name: 'HelloWorld',
}
</script>
