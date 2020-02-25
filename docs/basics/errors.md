---
title: Errors
order: 4
---

# Error handling

In `urql` by default we'll combine your errors into a [`CombinedError`](../api/core.md#combinederror-class) which normalises
GraphQL and Network errors into one class.

![Combined errors](../assets/urql-combined-error.png)

Note that a GraphQL error can occur alongside a successful fetch, this means that a certain sub-resolver, ... had an error while the
others returned their data successfully.
