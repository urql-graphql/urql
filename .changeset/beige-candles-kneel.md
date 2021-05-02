---
'@urql/vue': minor
---

A `useClientHandle()` function has been added. This creates a `handle` on which all `use*` hooks can be called, like `await handle.useQuery(...)` or `await handle.useSubscription(...)` which is useful for sequentially chaining hook calls in an `async setup()` function or preserve the right instance of a `Client` across lifecycle hooks.
