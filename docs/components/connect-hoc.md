### About

A HOC alternative implementation to the [Connect](Connect) component.

### Props

| Name      | Type                                                         | Default   | Description                                                  |
| --------- | ------------------------------------------------------------ | --------- | ------------------------------------------------------------ |
| query     | [Query](../types/mutation-query.md)?                         | undefined | The query you want connected to your component.              |
| mutations | Object { [string]: [Mutation](../types/mutation-query.md) }? | undefined | The mutation/mutations you want connected to your component. |

### Example

```jsx
import { ConnectHOC, createMutation, createQuery } from 'urql';
import { TodoList } from './components';

// ...
const connectArgs = {
  query: createQuery(QueryTodos),
  mutations: {
    addTodos: createMutation(AddTodos),
  },
};

// ...
return ConnectHOC(connectArgs)(TodoList);
```
