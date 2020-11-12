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
import { useClient } from '@urql/vue';

export default {
  name: 'App',
  setup() {
    useClient({
      url: 'https://countries-274616.ew.r.appspot.com/',
    });
  },
  components: {
    HelloWorld
  }
}
</script>
