---
title: Introduction
order: 0
---

# Introduction

`urql` is an implementation of a GraphQL client, built to be both easy to use for newcomers to
GraphQL, as well as extensible, to grow to support dynamic single-app applications and highly
customised GraphQL infrastructure. In short, `urql` prioritizes usability and adaptability.

As you're adopting GraphQL, `urql` becomes your primary data layer and can handle content-heavy
pages through ["Document Caching"](./basics/document-caching.md) as well as dynamic and data-heavy
pages through ["Normalized Caching"](./graphcache/normalized-caching.md).

## Constituent Parts

`urql` can be understood as a collection of connected parts and packages. When you [get
started](./basics/getting-started.md) you'll only need to install a single package for your
framework of choice. We're then able to declaratively send GraphQL requests to our API.

All framework packages — like `urql` and `@urql/preact` — wrap the core package, which we can
imagine as the brain of `urql` with most of its logic.

As we progress with implementing `urql` into our application, we're later able to extend it by
adding ["addon packages", which we call _Exchanges_](./concepts/exchanges.md)

## The Documentation

This documentation is split into groups or sections that cover different levels of usage or areas of
interest.

- **Basics** is the section where we find the ["Getting Started"
  guide](./basics/getting-started.md) and usage patterns for our framework of choice.
- **Main Concepts** then explains more about how `urql` functions, what it's made up of, and covers
  the main aspects of the `Client` and GraphQL clients in general, on the ["Philosophy"
  page](./concepts/philosophy.md)
- **Advanced** covers all more uncommon use-cases and contains guides that we won't need immediately
  when we get started with `urql`.
- **Graphcache** documents one of the most important addons to `urql`, which adds ["Normalized
  Caching" support](./graphcache/normalized-caching.md) to the `Client` and enables more complex
  use-cases, smarter caching, and more dynamic apps to function.
- **Showcase** aims to list some companies that use `urql`, third-party packages, and other helpful
  resources, like tutorials or guides.
- **API** contains a detailed list of all helpers, utilities, components, and other parts of each of
  `urql`'s packages, which may contain all details of each part and package.

We hope you grow to love `urql`!
