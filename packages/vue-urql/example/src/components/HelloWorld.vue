<template>
  <div>
    <div v-if="data">
      <pre>{{ data }}</pre>
    </div>
  </div>
</template>

<script>
import { useQuery } from './useQuery.js';

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
    console.log(result);

    return { data: result.data && JSON.stringify(result.data) };
  },
  name: 'HelloWorld',
}
</script>
