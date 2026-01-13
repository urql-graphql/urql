# @urql/solid

A highly customizable and versatile GraphQL client for SolidJS.

> **Note:** This package is for client-side SolidJS applications. If you're building a SolidStart application with SSR, use [`@urql/solid-start`](../solid-start-urql) instead. See the [comparison section](../solid-start-urql#solidjs-vs-solidstart) in the SolidStart package for key differences.

## Installation

```bash
npm install @urql/solid @urql/core graphql
# or
pnpm add @urql/solid @urql/core graphql
# or
yarn add @urql/solid @urql/core graphql
```

## Documentation

Full documentation is available at [formidable.com/open-source/urql/docs/](https://formidable.com/open-source/urql/docs/).

## Quick Start

```tsx
import { createClient, Provider, createQuery } from '@urql/solid';
import { cacheExchange, fetchExchange } from '@urql/core';
import { gql } from '@urql/core';

const client = createClient({
  url: 'https://api.example.com/graphql',
  exchanges: [cacheExchange, fetchExchange],
});

const TodosQuery = gql`
  query {
    todos {
      id
      title
    }
  }
`;

function App() {
  return (
    <Provider value={client}>
      <TodoList />
    </Provider>
  );
}

function TodoList() {
  const [result] = createQuery({ query: TodosQuery });

  return (
    <div>
      {result().data?.todos.map(todo => (
        <div>{todo.title}</div>
      ))}
    </div>
  );
}
```

## When to Use @urql/solid vs @urql/solid-start

| Use Case | Package |
|----------|---------|
| Client-side SPA | `@urql/solid` |
| SolidStart with SSR | `@urql/solid-start` |

For a detailed comparison of the APIs and when to use each package, see the [SolidJS vs SolidStart comparison](../solid-start-urql#solidjs-vs-solidstart) in the `@urql/solid-start` documentation.

## License

MIT
