---
'@urql/core': patch
---

Fix timing for out-of-band `client.reexecuteOperation` calls. This would surface in asynchronous caching scenarios, where no result would be delivered by the cache synchronously, while it still calls `client.reexecuteOperation` for e.g. a `network-only` request, which happens for `cache-and-network`. This issue becomes especially obvious in highly synchronous frameworks like Svelte.
