# Exchanges

## Packaged

These exchanges can be imported from the `urql` package.

- cacheExchange - caches all incoming data
- debugExchange - gives information about outgoing graphql requests in log format
- dedupExchange - deduplicates outgoing queries
- fetchExchange - used to manage the outgoing graphql requests
- subscriptionExchange - used to support subscriptions

## Third-party

- [Persisted Queries](https://github.com/Daniel15/urql-persisted-queries) -
  Uses persisted query hashes to send graphql-queries if possible
