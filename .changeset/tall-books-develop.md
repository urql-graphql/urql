---
'@urql/exchange-graphcache': minor
'@urql/core': minor
---

Add **experimental** support for `@defer` and `@stream` responses for GraphQL. This implements the ["GraphQL Defer and Stream Directives"](https://github.com/graphql/graphql-spec/blob/4fd39e0/rfcs/DeferStream.md) and ["Incremental Delivery over HTTP"](https://github.com/graphql/graphql-over-http/blob/290b0e2/rfcs/IncrementalDelivery.md) specifications. If a GraphQL API supports `multipart/mixed` responses for deferred and streamed delivery of GraphQL results, `@urql/core` (and all its derived fetch implementations) will attempt to stream results. This is _only supported_ on browsers [supporting streamed fetch responses](https://developer.mozilla.org/en-US/docs/Web/API/Response/body), which excludes IE11.
The implementation of streamed multipart responses is derived from [`meros` by `@maraisr`](https://github.com/maraisr/meros), and is subject to change if the RFCs end up changing.
