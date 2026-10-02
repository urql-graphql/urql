---
"@urql/core": patch
---

Fix `CombinedError`'s message dropping GraphQL error messages when a `networkError` is also present (e.g. after an SSR round-trip via `ssrExchange`, which can populate both fields). The `networkError` message is now prepended instead of replacing the GraphQL error messages entirely.
