### About

A HOC alternative implementation to the [Connect](Connect) component.

### Props

| Name               | Type                                                                      | Default   | Description                                                        |
| ------------------ | ------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------ |
| query              | [Query](../types/mutation-query-subscription.md)?                         | undefined | The query you want connected to your component.                    |
| mutations          | Object { [string]: [Mutation](../types/mutation-query-subscription.md) }? | undefined | The mutation/mutations you want connected to your component.       |
| subscription       | Array<[Subscription](../types/mutation-query-subscription.md)>?           | undefined | The subscriptions you want connected to your component.            |
| updateSubscription | (type, state, data) => newData?                                           | undefined | An updator function to merge the new data with the existing state. |

### Example

```jsx
import { ConnectHOC, createMutation, createQuery, createSubscription } from 'urql';
import { TodoList } from './components';

// ...
const connectArgs = {
  query: createQuery(QueryTodos),
  mutations: {
    addTodos: createMutation(AddTodos),
  },
  subscriptions: [createSubscription(TodoAdded)]
  updateSubscription(type, state, data) => {
    if (type === 'todoAdded') {
      state.push(data);
      return state;
    }
  },
};

// ...
return ConnectHOC(connectArgs)(TodoList);
```
