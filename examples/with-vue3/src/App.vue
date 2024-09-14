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
import { provideClient, cacheExchange, fetchExchange } from '@urql/vue';
import PokemonList from './PokemonList.vue';

export default {
  name: 'App',
  setup() {
    provideClient({
      url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
      exchanges: [cacheExchange, fetchExchange],
    });
  },
  components: {
    PokemonList,
  },
};
</script>
