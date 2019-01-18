### Description

Create a [Query](../types/mutation-query-subscription.md) from a GraphQL query.

### Arguments

| Name      | Type    | Description                              |
| --------- | ------- | ---------------------------------------- |
| query     | string  | A GraphQL query string.                  |
| variables | object? | A collection of GraphQL query variables. |

### Example

```jsx
import { createQuery } from 'urql';

const queryString = `
query {
  todos {
    id
    text
  }
}
`;

const query = createQuery(queryString);
```
