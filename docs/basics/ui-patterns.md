---
title: UI-Patterns
order: 6
---

# UI Patterns

> This page is incomplete. You can help us expanding it by suggesting more patterns or asking us about common problems you're facing on [GitHub Discussions](https://github.com/FormidableLabs/urql/discussions).

Generally, `urql`'s API surface is small and compact. Some common problems that we're facing when building apps may look like they're not a built-in feature, however, there are several patterns that even a lean UI can support.
This page is a collection of common UI patterns and problems we may face with GraphQL and how we can tackle them in
`urql`. These examples will be written in React but apply to any other framework.

## Infinite scrolling

"Infinite Scrolling" is the approach of loading more data into a page's list without splitting that list up across multiple pages.

There are a few ways of going about this. In our [normalized caching chapter on the topic](../graphcache/local-resolvers.md#pagination)
we see an approach with `urql`'s normalized cache, which is suitable to get started quickly. However, this approach also requires some UI code as well to keep track of pages.
Let's have a look at how we can create a UI implementation that makes use of this normalized caching feature.

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

const SearchResultPage = ({ variables, isLastPage, onLoadMore }) => {
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
list that constantly changes. [You can find a full code example of this pattern in our example folder on the topic of Graphcache pagination.](https://github.com/FormidableLabs/urql/tree/main/examples/with-graphcache-pagination)

We also do not need to use our normalized cache to achieve this. As long as we're able to split individual lists up into chunks across components, we can also solve this problem entirely in UI code. [Read our example code on how to achieve this.](https://github.com/FormidableLabs/urql/tree/main/examples/with-pagination)

## Prefetching data

We sometimes find it necessary to load data for a new page before that page is opened, for instance while a JS bundle is still loading. We may
do this with help of the `Client`, by calling methods without using the React bindings directly.

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

Here we're calling `client.query` to prepare a query when the transition begins.
We then call `toPromise()` on this query which activates it. Our `Client` and its cache share results, which means that we've already kicked off or even completed the query before we're on the new page.

## Lazy query

It's often required to "lazily" start a query, either at a later point or imperatively. This means that we don't start a query when a new component is mounted immediately.

Parts of `urql` that automatically start, like the `useQuery` hook, have a concept of a [`pause` option.](./react-preact.md#pausing-usequery) This option is used to prevent the hook from automatically starting a new query.

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
  const [result, fetch] = useQuery({ query: TodoQuery, pause: true });
  const router = useRouter();

  return (
    <button onClick={fetch}>
      Load todos
    </button>
  )
}
```

We can unpause the hook to start fetching, or, like in this example, call its returned function to manually kick off the query.

## Reacting to focus and stale time

In urql we leverage our extensibility pattern named "Exchanges" to manipulate the way
data comes in and goes out of our client.

- [Stale time](https://github.com/FormidableLabs/urql/tree/main/exchanges/request-policy)
- [Focus](https://github.com/FormidableLabs/urql/tree/main/exchanges/refocus)

When we want to introduce one of these patterns we add the package and add it to the `exchanges`
property of our `Client`. In the case of these two we'll have to add it before the cache
else our requests will never get upgraded.

```js
import { createClient, dedupExchange, cacheExchange, fetchExchange } from 'urql';
import { refocusExchange } from '@urql/exchange-refocus';

const client = createClient({
  url: 'some-url',
  exchanges: [
    dedupExchange,
    refocusExchange(),
    cacheExchange,
    fetchExchange,
  ]
})
```

That's all we need to do to react to these patterns.

