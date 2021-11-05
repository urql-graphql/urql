---
title: UI-Patterns
order: 6
---

# UI Patterns

Here we'll be tackling a set of common UI-patterns and how we tackle them in
`urql`. These examples will be written in React but apply to any other framework.

## Infinite scrolling

## Lazy query

## Show previous data while loading

## Prefetching data

Let's say we want to load data for a new page while the JS-bundle is loading, we can
do this with help of the `urql-client`.

```js
import React from 'react';
import { useClient } from 'urql';

const QUERY = `
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
    const loadJSBundle = import('./page.js')
    const loadData = client.query(QUERY, { id }).toPromise()
    await Promise.all([loadJSBundle, loadData])
    router.push(`/todo/${id}`);
  }, [])
}
```

So basically what goes on here is that when we transition we'll prepare the data by calling `.query`
this will then be saved in cache and available to the next utility querying this data, so no more loading!

## Reacting to focus

## Refresh a query after a given period of time
