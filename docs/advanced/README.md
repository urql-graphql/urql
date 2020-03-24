---
title: Advanced
order: 4
---

# Advanced

In this chapter we'll dive into various topics of "advanced" `urql` usage. This is admittedly a
catch-all chapter of various use-cases that can only be covered after [the "Concepts"
chapter.](../concepts/README.md)

- [**Subscriptions**](./subscriptions.md) covers how to use `useSubscription` and how to set up GraphQL subscriptions with
  `urql`.
- [**Server-side Rendering**](./server-side-rendering.md) guides us through how to set up server-side rendering and rehydration.
- [**Auto-populate Mutations**](./auto-populate-mutations.md) presents the `populateExchange` addon which can make it easier to
  update normalized data after mutations.
- [**Retrying operations**](./retry-operations.md) shows the `retryExchange` which allows you to retry operations when they've failed.
- [**Testing**](./testing.md) covers how to test components that use `urql` particularly in React.
