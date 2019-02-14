### About

Connect is a ReactJS component that is used to execute queries and mutations and render child components with the results, using a render prop.

### Props

| Name               | Type                                                                      | Default   | Description                                                        |
| ------------------ | ------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------ |
| query              | [Query](../types/mutation-query-subscription.md)?                         | undefined | The query you want connected to your component                     |
| mutations          | Object { [string]: [Mutation](../types/mutation-query-subscription.md) }? | undefined | The mutation/mutations you want connected to your component        |
| subscription       | Array<[Subscription](../types/mutation-query-subscription.md)>?           | undefined | The subscriptions you want connected to your component.            |
| updateSubscription | (type, state, data) => newData?                                           | undefined | An updator function to merge the new data with the existing state. |
| children           | ([ChildArgs\<T\>](../types/child-args.md)) => ReactNode                   | undefined | A child function to accept the connected state and render elements |

### Example

```jsx
import { Connect, createQuery, createMutation, createSubscription } from 'urql';

// ...
<Connect
  query={createQuery(GetTodos)}
  mutations={{
    addTodo: createMutation(AddTodo)
  }}
  subscriptions={[createSubscription(TodoAdded)]}
  updateSubscription={(type, state, data) => {
    if (type === 'todoAdded') {
      state.push(data);
      return state;
    }
  }}
  children={({ fetching, data }) => {
    return fetching ? <Loading/> : <List data={data.todos}>
  }}
/>
```
