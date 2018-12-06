### About

Connect is a ReactJS component that is used to execute queries and mutations and render child components with the results, using a render prop.

### Props

| Name      | Type                                                         | Default   | Description                                                        |
| --------- | ------------------------------------------------------------ | --------- | ------------------------------------------------------------------ |
| query     | [Query](../types/mutation-query.md)?                         | undefined | The query you want connected to your component                     |
| mutations | Object { [string]: [Mutation](../types/mutation-query.md) }? | undefined | The mutation/mutations you want connected to your component        |
| children  | ([ChildArgs\<T\>](../types/child-args.md)) => ReactNode      | undefined | A child function to accept the connected state and render elements |

### Example

```jsx
import { Connect, createQuery, createMutation } from 'urql';

// ...
<Connect
  query={createQuery(GetTodos)}
  mutations={{
    addTodo: createMutation(AddTodo)
  }}
  children={({ fetching, data }) => {
    return fetching ? <Loading/> : <List data={data.todos}>
  }}
/>
```
