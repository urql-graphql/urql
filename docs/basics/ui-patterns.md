---
title: UI-Patterns
order: 6
---

# UI Patterns

Here we'll be tackling a set of common UI-patterns and how we tackle them in
`urql`. These examples will be written in React but apply to any other framework.

## Infinite scrolling

There are a few ways of going about this, in our [normalized caching chapter](../graphcache/local-resolvers/#pagination)
you'll see an approach with urql, in the default cache we'd say to manually hold it inside of a hook but here
we'll see a general approach that works.

```js
import React from 'react';
import { useQuery, gql } from 'urql';

const PageQuery = gql`
  query Page($first: Int!, $after: String) {
    todos(first: $first, after: $after) {
      nodes {
        id
        name
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const ListPage = ({ variables, isLastPage }) => {
  const [{ data, fetching, error }] = useQuery({ query: PageQuery, variables });
  const todos = data?.todos;

  return (
    <div>
      {error && <p>Oh no... {error.message}</p>}
      {fetching && <p>Loading...</p>}
      {todos && (
        <>
          {todos.nodes.map(todo => (
            <div key={todo.id}>
              {todo.id}: {todo.name}
            </div>
          ))}
          {isLastPage && todos.pageInfo.hasNextPage && (
            <button
              onClick={() => onLoadMore(todos.pageInfo.endCursor)}
            >
              load more
            </button>
          )}
        </>
      )}
    </div>
  );
}

const Search = () => {
  const [pageVariables, setPageVariables] = useState([
    {
      first: 10,
      after: '',
    },
  ]);

  return (
    <div>
      {pageVariables.map((variables, i) => (
        <SearchResultPage
          key={'' + variables.after}
          variables={variables}
          isLastPage={i === pageVariables.length - 1}
          onLoadMore={after =>
            setPageVariables([...pageVariables, { after, first: 10 }])
          }
        />
      ))}
    </div>
  );
}
```

Here we keep an array of all `variables` we've encountered and use them to render their
respective `result` page. This only rerenders the additional page rather than having a long
list that constantly changes.

## Prefetching data

Let's say we want to load data for a new page while the JS-bundle is loading, we can
do this with help of the `urql-client`.

```js
import React from 'react';
import { useClient, gql } from 'urql';

const TodoQuery = gql`
  query Todo($id: ID!) {
    todo(id: $id) {
      id
      name
    }
  }
`;

const Component = () => {
  const client = useClient();
  const router = useRouter();

  const transitionPage = React.useCallback(async (id) => {
    const loadJSBundle = import('./page.js');
    const loadData = client.query(TodoQuery, { id }).toPromise();
    await Promise.all([loadJSBundle, loadData]);
    router.push(`/todo/${id}`);
  }, []);

  return (
    <button onClick={() => transitionPage('1')}>
      Go to todo 1
    </button>
  )
}
```

So basically what goes on here is that when we transition we'll prepare the data by calling `.query`
this will then be saved in cache and available to the next utility querying this data, so no more loading!

## Lazy query

When we look at the concept of a `lazy query` we can leverage the concept of [`pause`](./react-preact.md#pausing-usequery)

```js
import React from 'react';
import { useQuery, gql } from 'urql';

const TodoQuery = gql`
  query Todos {
    todos {
      id
      name
    }
  }
`;

const Component = () => {
  const [result, fetch] = useQuery({ query: TodoQuery });
  const router = useRouter();

  return (
    <button onClick={fetch}>
      Load todos
    </button>
  )
}
```

Now when we click the butotn the data will start loading

## Reacting to focus

## Refresh a query after a given period of time
