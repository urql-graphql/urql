---
title: Quick start
order: 0
---

# Quick start

`urql` is a blazingly fast, lightweight, and customisable GraphQL client. We believe in usability and adaptability, `urql` is built with extensibility at its
core, allowing you to include just the key logic for a basic app, in addition to being able to grow to support dynamic single-app applications and highly
customised infrastructure.

In this page we'll take a look at the quickest route to get up and running with `urql`.

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
