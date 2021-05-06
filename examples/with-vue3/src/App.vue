<template>
  <Suspense>
    <template #default>
      <PokemonList />
    </template>
    <template #fallback>
      <div>Loading...</div>
    </template>
  </Suspense>
</template>

<script>
import { provideClient } from '@urql/vue';
import PokemonList from './PokemonList.vue'

export default {
  name: 'App',
  setup() {
    provideClient({
      url: 'https://trygql.dev/graphql/basic-pokedex',
    });
  },
  components: {
    PokemonList
  }
}
</script>
