---
'@urql/svelte': major
---

Reimplement the `@urql/svelte` API, which is now marked as stable.
The new `@urql/svelte` API features the `query`, `mutation`, and `subscription` utilities, which are
called as part of a component's normal lifecycle and accept `operationStore` stores. These are
writable stores that encapsulate both a GraphQL operation's inputs and outputs (the result)!

Learn more about how to use `@urql/svelte` [in our new API
docs](https://formidable.com/open-source/urql/docs/api/svelte/) or starting from the [Basics
pages.](https://formidable.com/open-source/urql/docs/basics/)
