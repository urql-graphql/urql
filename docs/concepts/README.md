---
title: Main Concepts
order: 3
---

# Main Concepts

In this chapter we'll learn about the motivation behind `urql`, the architecture that drives it, the
inner workings of the `Client`, and how to write extensions and addons, also known as _Exchanges_.

Each page goes a little further in explaining a core concept of `urql`.

- [**Philosophy**](./philosophy.md) gives a quick overview of the different aspects of GraphQL clients and `urql` in
  particular, which shines a light on why you may want to use `urql`.
- [**Stream Pattern**](./stream-patterns.md) explains the inner working of `urql`, which is _stream-based_, also known as
  Observable patterns in JS.
- [**Core Package**](./core-package.md) defines why a shared package exists that contains the main logic of `urql`, and
  how we can use it directly in Node.js.
- [**Exchanges**](./exchanges.md) finally introduces _Exchanges_ and how to write extensions or addons and use them
  in `urql`.

Finally, some _Exchanges_ are covered in different sections of the documentation, like
["Subscriptions"](../advanced/subscriptions.md), ["Server-side
Rendering"](../advanced/server-side-rendering.md), or ["Normalized
Caching"](../graphcache/normalized-caching.md). It's advisable to read this chapter before moving on
to using _Exchanges_.
