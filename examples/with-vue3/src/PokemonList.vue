<template>
  <div>
    <ul v-if="pokemons">
      <li v-for="pokemon in pokemons.pokemons" :key="pokemon.id">
        {{ pokemon.name }}
      </li>
    </ul>
    <button @click="nextPage">Next Page</button>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { gql, useQuery } from '@urql/vue';

export default {
  async setup() {
    const skip = ref(0);

    const pokemons = await useQuery({
      query: gql`
        query ($skip: Int!) {
          pokemons(limit: 10, skip: $skip) {
            id
            name
          }
        }
      `,
      variables: { skip },
    });

    return {
      pokemons: pokemons.data,
      nextPage() {
        skip.value += 10;
      },
    };
  },
  name: 'PokemonList',
};
</script>
