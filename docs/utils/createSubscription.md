### Description

Create a [Subscription](../types/mutation-query-subscription.md) from a GraphQL query.

### Arguments

| Name      | Type    | Description                              |
| --------- | ------- | ---------------------------------------- |
| query     | string  | A GraphQL subscription string.           |
| variables | object? | A collection of GraphQL query variables. |

### Example

```jsx
import { createSubscription } from 'urql';

const subscriptionString = `
subscription {
  todoAdded {
    id
    text
  }
}
`;

const subscription = createSubscription(subscriptionString);
```
