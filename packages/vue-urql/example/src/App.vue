<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <Suspense>
    <template #default>
      <HelloWorld msg="Hello Vue 3.0 + Vite" />
    </template>
    <template #fallback>
      <div>Loading...</div>
    </template>
  </Suspense>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import { provideClient } from '@urql/vue';

export default {
  name: 'App',
  setup() {
    provideClient({
      url: 'https://trygql.dev/graphql/basic-pokedex',
    });
  },
  components: {
    HelloWorld
  }
}
</script>
