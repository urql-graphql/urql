# Exchanges

## Persisted Queries

[Repository](https://github.com/Daniel15/urql-persisted-queries)

Quoting from the repository:

Apollo Server implements Automatic Persisted Queries (APQ),
a technique that greatly improves network performance for GraphQL with
zero build-time configuration. A persisted query is a ID or hash that
can be sent to the server instead of the entire GraphQL query string.
This smaller signature reduces bandwidth utilization and speeds up client
loading times. Persisted queries are especially nice paired with GET requests,
enabling the browser cache and integration with a CDN.

With Automatic Persisted Queries, the ID is a deterministic hash of the input query,
so we don't need a complex build step to share the ID between clients and servers.
If a server doesn't know about a given hash, the client can expand the query for it.
Apollo Server caches that mapping.

Needless to say your server needs to support this.
