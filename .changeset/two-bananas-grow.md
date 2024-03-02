---
'@urql/core': minor
---

Add support for sending persisted documents. Any `DocumentNode` with no/empty definitions and a `documentId` property is considered a persisted document. When this is detected a `documentId` parameter rather than a `query` string is sent to the GraphQL API, similar to Automatic Persisted Queries (APQs). However, APQs are only supported via `@urql/exchange-persisted`, while support for `documentId` is now built-in.
