---
'@urql/vue': patch
---

Stop `useQuery` from re-executing (and hitting the network) during SSR hydration when it's awaited for Suspense. Awaiting the query subscribed to the operation a second time, which re-dispatched it after the `ssrExchange` result had already been consumed, triggering a redundant network request even with `staleWhileRevalidate: false`. The awaited promise now resolves with the already-settled result instead of re-subscribing.
