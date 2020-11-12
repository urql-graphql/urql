<template>
  <div>
    <div v-if="data">
      <pre>{{ JSON.stringify(data) }}</pre>
    </div>
  </div>
</template>

<script>
import { useQuery } from '@urql/vue';

export default {
  async setup() {
    const query = `
      query {
        Country {
          name
        }
      }
    `;

    const result = useQuery({ query });
    return { data: result.data };
  },
  name: 'HelloWorld',
}
</script>
