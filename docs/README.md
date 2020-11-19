---
title: Overview
order: 1
---

# Overview

`urql` is a highly customizable and versatile GraphQL client with which you add on features like
normalized caching as you grow. It's built to be both easy to use for newcomers to
GraphQL, as well as extensible, to grow to support dynamic single-app applications and highly
customized GraphQL infrastructure. In short, `urql` prioritizes usability and adaptability.

As you're adopting GraphQL, `urql` becomes your primary data layer and can handle content-heavy
pages through ["Document Caching"](./basics/document-caching.md) as well as dynamic and data-heavy
apps through ["Normalized Caching"](./graphcache/normalized-caching.md).

## Constituent Parts

`urql` can be understood as a collection of connected parts and packages. When [getting started](./basics/getting-started.md) we only need to install a single package for our
framework of choice. We're then able to declaratively send GraphQL requests to our API.

All framework packages — like `urql` (for React), `@urql/preact`, `@urql/svelte`, and `@urql/vue` —
wrap the [core package, `@urql/core`](./concepts/core-package.md), which we can imagine as the brain
of `urql` with most of its logic.

As we progress with implementing `urql` into our application, we're later able to extend it by
adding ["addon packages", which we call _Exchanges_](./concepts/exchanges.md)

## Quick Start

We have **Getting Started** guides for
[React &
Preact](https://formidable.com/open-source/urql/docs/basics/getting-started/#react--preact),
[Svelte](https://formidable.com/open-source/urql/docs/basics/getting-started/#svelte), and
[Vue](https://formidable.com/open-source/urql/docs/basics/getting-started/#vue) which walk through
how to install the bindings for your framework of choice and set up the
[`Client`](./api/core.md#client).

Generally for React this would look like this, where the `urql` package may be replaced with your
framework's bindings:

```sh
npm i --save urql graphql
# or
yarn add urql graphql
```

The **Basics** section also features pages to [write
Queries](https://formidable.com/open-source/urql/docs/basics/queries/),
[Mutations](https://formidable.com/open-source/urql/docs/basics/mutations/), after which we could
continue learning about
[Subscriptions](https://formidable.com/open-source/urql/docs/advanced/subscriptions/). These are
among the only pages that are framework-specific.

## The Documentation

This documentation is split into groups or sections that cover different levels of usage or areas of
interest.

- **Basics** is the section where we find the ["Getting Started"
  guide](./basics/getting-started.md) and usage patterns for our framework of choice.
- **Main Concepts** then explains more about how `urql` functions, what it's made up of, and covers
  the main aspects of the `Client` and GraphQL clients in general, on the ["Philosophy"
  page](./concepts/philosophy.md).
- **Advanced** covers all more uncommon use-cases and contains guides that we won't need immediately
  when we get started with `urql`.
- **Graphcache** documents one of the most important addons to `urql`, which adds ["Normalized
  Caching" support](./graphcache/normalized-caching.md) to the `Client` and enables more complex
  use-cases, smarter caching, and more dynamic apps to function.
- **Showcase** aims to list users of `urql`, third-party packages, and other helpful resources,
  like tutorials and guides.
- **API** contains a detailed list of all helpers, utilities, components, and other parts of each of
  `urql`'s packages, which may contain all details of each part and package.

We hope you grow to love `urql`!
