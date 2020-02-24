---
title: Normalized Caching
order: 1
---

# Normalized Caching

In urql we have the option to utilize a normalized caching mechanism,
this opens up a world of new features ranging from automatic updates
to offline capabilities.

Instead of storing a query by its `operationKey` we'll store the entities
we get back and normalize them so for instance:

```js
todo: {
  __typename: 'Todo',
  id: 1,
  title: 'implement graphcache',
  author: {
    __typename: 'Author',
    id: 1,
    name: 'urql-team',
  }
}
```

will become

```js
{
  "Todo:1.title": 'implement graphcache',
  "Todo:1.author": 1,
  "Author:1.name": 'urql-team',
}
```

This allows us to for instance take the result of an update mutation to
`Todo:1` and automatcally update altered properties, this also allows us to
reuse entities. We will always try to create a key with the `__typename` and the
`id` or `_id` whichever is present.
