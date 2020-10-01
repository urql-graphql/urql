<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <HelloWorld msg="Hello Vue 3.0 + Vite" />
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import { useClient } from './components/useClient.js';

export default {
  name: 'App',
  setup() {
    console.log(useClient);
    useClient({
      url: 'https://countries-274616.ew.r.appspot.com/',
    });
  },
  components: {
    HelloWorld
  }
}
</script>
