---
title: Philosophy
order: 1
---

# Philosophy

`urql` is a highly customizable and flexible GraphQL client, that happens to come with some default
[core behavior in the core package](./core-package.md).

By default, we aim to provide features that allow you to build your app quickly with minimal
configuration. `urql` is a client that grows with you. As you go from building your first
GraphQL app to a full experience, we give you the tools to extend and customize `urql` based on
your needs.

In this guide, we will walkthrough how `urql` is set up internally and how all pieces of the puzzle
— the building blocks of `urql` — interact with one another.

## Hello World

[We previously read about how to set up a `Client` in "Getting
Started".](../basics/getting-started.md)

When you use `urql` you will always create and set up a `Client` for which a `createClient`
convenience helper exists.

```js
import { Client } from 'urql';

const client = new Client({
  url: 'http://localhost:3000/graphql',
});
```

In `urql`, the client is the first step towards manging the complexity of GraphQL automatically.

## Using GraphQL Clients

You may have worked on a GraphQL API previously and noticed that using GraphQL in your app can be
as straightforward as sending a plain HTTP request with your query to fetch some data.

But GraphQL provides an opportunity to abstract away a lot of the manual work that goes with
sending these queries and managing the data. This ultimately lets you focus on building
your app without handling the technical details of state management in detail.

Specifically `urql` simplifies three common aspects of using GraphQL easily:

- Sending queries and mutations and receiving results _declaratively_
- Abstracting _caching_ and state management internally
- Providing a central point of _extensibility_ and integration with your API

In the following sections we'll talk about how `urql` solves these three problems, and how this is
accomplished and abstracted internally.

## Declarative Queries

When you implement queries or mutations with `urql` the `Client` will internally manage the
lifetime and updates for these _operations_.

Such an _operation_ may be sent to your GraphQL API and you'll subsequently receive results.
When a _cache_ invalidates this result you may receive updated results. When your app
stops being interested in results for an _operation_ (e.g. React unmounts your component) then
the `Client` knows to _teardown_ the _operation_ and stops requesting new data or sending you
results.

![Operations and Results](../assets/urql-event-hub.png)

This all happens in the background while you just declare that you'd like to have data for a given
query.

## Caching and State

When we use GraphQL queries and mutations declaratively with `urql`, we expect them to interact
and update automatically.

Furthermore, we don't wish to send more requests for a query, when we've done so before. We'd like
to instead cache results in-memory and notify other parts of an app when these results change or
are invalidated by mutations or subscriptions.

GraphQL clients have access to some amount of type information for any GraphQL API and can hence
cache the results of queries automatically. In `urql` the `Client` can be extended with several
cache implementations, but all of them mean that you'll never mix your declarative query or mutation
code with cache-implementation details, which mostly happen behind the scenes.

[We previously read about the default "Document Caching".](../basics/document-caching.md)

Some GraphQL clients also resort to caching data in a normalized format. This is similar to
[how you may store data in Redux.](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape/)
Using this approach the cache uses more type information to reference parts of the GraphQL only once
in the cache and structures it in a graph, which leads to more shared data, and hence more shared
updates in your UI!

[Read more about how to add "Normalized Caching" to an app.](../graphcache/normalized-caching.md)

## Extensibility and Integration

With any kind of API come other concerns apart from caching and state mangagement that concern
the global behavior or business logic of your application.

For instance, you may want to add authentication, retry-logic for failed requests, or a global
error handler.

`urql` provides a concept of _Exchanges_ to abstract the details of how the `Client` interacts with
your framework of choice, your app, and your GraphQL API. They are akin to
[middleware in Redux](https://redux.js.org/advanced/middleware) and have access to all operations
and all results.

[Read more about _Exchanges_ in a later page of the documentation.](./exchanges.md)

All default behavior in the [core package](./core-package.md) is implemented using
_Exchanges_, which is possible because all operations and all results are treated as a stream
of events. We call these events "Operations".

![Operation Signature](../assets/urql-signals.png)

From our perspective, thinking about your GraphQL queries and results in terms of
streams of operations and results allows us to implement any given complex behaviour,
which we'll learn more about in the next section.
