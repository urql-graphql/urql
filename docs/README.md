---
title: Overview
order: 1
---

# Overview

`urql` is a highly customizable and versatile GraphQL client with which you add on features like
normalized caching as you grow. It's built to be both easy to use for newcomers to
GraphQL, and extensible, to grow to support dynamic single-app applications and highly
customized GraphQL infrastructure. In short, `urql` prioritizes usability and adaptability.

As you're adopting GraphQL, `urql` becomes your primary data layer and can handle content-heavy
pages through ["Document Caching"](./basics/document-caching.md) as well as dynamic and data-heavy
apps through ["Normalized Caching"](./graphcache/normalized-caching.md).

`urql` can be understood as a collection of connected parts and packages.
When we only need to install a single package for our framework of choice. We're then able to
declaratively send GraphQL requests to our API. All framework packages — like `urql` (for React),
`@urql/preact`, `@urql/svelte`, `@urql/solid`/`@urql/solid-start` and `@urql/vue` — wrap the [core package,
`@urql/core`](./basics/core.md), which we can imagine as the brain
of `urql` with most of its logic. As we progress with implementing `urql` into our application,
we're later able to extend it by adding ["addon packages", which we call
_Exchanges_](./advanced/authoring-exchanges.md)

If at this point you're still unsure of whether to use `urql`, [have a look at the **Comparison**
page](./comparison.md) and check whether `urql` supports all features you're looking for.

## Where to start

We have **Getting Started** guides for:

- [**React/Preact**](./basics/react-preact.md) covers how to work with the bindings for React/Preact.
- [**Vue**](./basics/vue.md) covers how to work with the bindings for Vue 3.
- [**Svelte**](./basics/svelte.md) covers how to work with the bindings for Svelte.
- [**Solid**](./basics/solid.md) covers how to work with the bindings for Solid.
- [**SolidStart**](./basics/solid-start.md) covers how to work with the bindings for SolidStart.
- [**Core Package**](./basics/core.md) covers the shared "core APIs" and how we can use them directly
  in Node.js or imperatively.

Each of these sections will walk you through the specific instructions for the framework bindings,
including how to install and set them up, how to write queries, and how to send mutations.

## Following the Documentation

This documentation is split into groups or sections that cover different levels of usage or areas of
interest.

- **Basics** is the section where we'll want to start learning about `urql` as it contains "Getting
  Started" guides for our framework of choice.
- **Architecture** then explains more about how `urql` functions, what it's made up of, and covers
  the main aspects of the `Client` and exchanges.
- **Advanced** covers all more uncommon use-cases and contains guides that we won't need immediately
  when we get started with `urql`.
- **Graphcache** documents one of the most important addons to `urql`, which adds ["Normalized
  Caching" support](./graphcache/normalized-caching.md) to the `Client` and enables more complex
  use-cases, smarter caching, and more dynamic apps to function.
- **Showcase** aims to list users of `urql`, third-party packages, and other helpful resources,
  like tutorials and guides.
- **API** contains a detailed documentation on each package's APIs. The documentation links to each
  of these as appropriate, but if we're unsure of how to use a utility or package, we can go here
  directly to look up how to use a specific API.

We hope you grow to love `urql`!
