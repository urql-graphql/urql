### About

You want to use the _Provider_ component at the root of your project. This will configure your _urql_ client for use throughout the application.

### Props

| Name   | Type     | Default   | Description                                  |
| ------ | -------- | --------- | -------------------------------------------- |
| client | `Client` | undefined | The _urql_ client for use throughout the app |

### Example

```jsx
import { Provider, createClient } from 'urql';

// ...
const client = createClient({
  url: 'http://localhost:3001/graphql',
});

// ...
<Provider client={client}>
  <Home />
</Provider>;
```
