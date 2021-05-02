<template>
  <div>
    <div v-if="pokemons">
      <pre>{{ JSON.stringify(pokemons) }}</pre>
    </div>
    <div v-if="pokemon">
      <pre>{{ JSON.stringify(pokemon) }}</pre>
    </div>
    <button @click="nextPokemon">Next Pokemon</button>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
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

    const index = ref(0);

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
        id: computed(() => pokemons.data.value.pokemons[index.value].id),
      },
    });

    return {
      pokemons: pokemons.data,
      pokemon: pokemon.data,
      nextPokemon() {
        index.value = index.value < (pokemons.data.value.pokemons.length - 1)
          ? index.value + 1
          : 0;
      },
    };
  },
  name: 'HelloWorld',
}
</script>
