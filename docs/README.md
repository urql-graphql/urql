---
title: Quick start
order: 0
---

# Quick start

Here we'll see the quickest way to get started with `urql`.

## Installation

```sh
# npm
npm i --save urql graphql
# or yarn
yarn add urql graphql
```

## Making the client

```jsx
import { createClient, Provider } from 'urql';

const client = createClient({ url: 'https://0ufyz.sse.codesandbox.io' });

const App = () => (
  <Provider value={client}>
    <Todos />
  </Provider>
);
```

## Querying data

```jsx
const Todos = () => {
  const [res, executeQuery] = useQuery({
    query: `
      query { todos { id text } }
    `,
  });

  if (res.fetching) return <p>Loading...</p>;
  if (res.error) return <p>Errored!</p>;

  return (
    <ul>
      {res.data.todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
};
```
