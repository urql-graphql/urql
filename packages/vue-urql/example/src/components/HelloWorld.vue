<template>
  <div>
    <div v-if="data">
      <pre>{{ data }}</pre>
    </div>
  </div>
</template>

<script>
import { useQuery } from '@urql/vue';

const query = `
  query {
    Country {
      name
    }
  }
`;

export default {
  setup() {
    const query = `
      query {
        Country {
          name
        }
      }
    `;

    const result = useQuery({ query });

    return { data: result.data && JSON.stringify(result.data) };
  },
  name: 'HelloWorld',
}
</script>
