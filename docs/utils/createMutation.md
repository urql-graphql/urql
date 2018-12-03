### Description

Create a [Mutation](Mutation) from a mutation query.

### Arguments

| Name      | Type    | Description                                 |
| --------- | ------- | ------------------------------------------- |
| query     | string  | A GraphQL mutation query string.            |
| variables | object? | A collection of GraphQL mutation variables. |

### Example

```jsx
import { createMutation } from 'urql';

const mutationString = `
mutation($text: String!) {
  addTodo(text: $text) {
    id
    text
  }
}
`;

const mutationArgs = {
  text: 'This is a todo!',
};

const mutation = createMutation(mutationString, mutationArgs);
```
