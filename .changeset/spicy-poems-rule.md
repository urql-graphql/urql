---
'@urql/core': minor
---

Add a `staleWhileRevalidate` option to the `ssrExchange`, which allows the client to immediately refetch a new result on hydration, which may be used for cached / stale SSR or SSG pages. This is different from using `cache-and-network` by default (which isn't recommended) as the `ssrExchange` typically acts like a "replacement fetch request".
