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
- [**Persistence & Uploads**](./persistence-and-uploads.md) teaches us how to set up Automatic
  Persisted Queries and File Uploads using the two respective packages.
- [**Server-side Rendering**](./server-side-rendering.md) guides us through how to set up server-side rendering and rehydration.
- [**Debugging**](./debugging.md) shows us the [`urql`
  devtools](https://github.com/FormidableLabs/urql-devtools/) and how to add our own debug events
  for its event view.
- [**Retrying operations**](./retry-operations.md) shows the `retryExchange` which allows you to retry operations when they've failed.
- [**Authentication**](./authentication.md) describes how to implement authentication using the `authExchange`
- [**Testing**](./testing.md) covers how to test components that use `urql` particularly in React.
- [**Auto-populate Mutations**](./auto-populate-mutations.md) presents the `populateExchange` addon which can make it easier to
  update normalized data after mutations.
