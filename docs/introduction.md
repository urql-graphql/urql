---
title: Introduction
order: 0
---

# Introduction

<!-- TODO: Write about urql -->

## Motivation

<!-- TODO: Why is urql a thing? What can the user expect? -->

## Getting Started

In urql we have a core package (`@urql/core`) containing the `client`, this `client` is in charge
of orchestrating all the communication between your UI and the server. We support integration with
two front-end frameworks at the moment, [React](https://reactjs.org/) and [Preact](https://preactjs.com/).

Let's dive into it [get started with urql](./basics/README.md)!

## Client and Operations

In `urql` all operations are controlled by a central `Client`.
This client is responsible for managing GraphQL operations and sending requests.

![The Client as an Event Hub](./assets/urql-client-architecture.png)

When you use `urql` operations are dispatched on the client (A, B, C) which will be handled by the client on a
single stream of inputs. As responses come back from the cache or your GraphQL API one or more results are
dispatched on an output stream that correspond to the operations, which update the hooks.

![Operations and Results](./assets/urql-event-hub.png)

Hence the client can be seen as an event hub. Operations are sent to the client, which executes them and
sends back a result. A special teardown-event is issued when a hook unmounts or updates to a different
operation.

![Operation Signature](./assets/urql-signals.png)

## Normalized Caching

You can choose to use normalized caching instead.

In the normalised cache we won't just take your response and save it for an operation, instead we will look at the response
and extract the different types. These types are used to create entries in our cache so we can identify them `<type>:<id>.property`,
this allows us to look at responses for `mutations/subscriptions` and automatically update existing entities.

![Normalized Caching](./assets/urql-normalized-cache.png)

The main difference with the document-cache is that we don't have to refetch queries for every mutation, we can automatically update
if the entity exists in cache or we can specify what the cache should do with a certain mutation response.

This normalised cache has more features:

- optimistic updates
- entity/property resolvers
- cache-persistence
- schema-awareness
- custom keys

[Read all about it here.](./graphcache/README.md)

