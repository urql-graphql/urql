---
'@urql/exchange-graphcache': minor
---

Implement **local directives**. It’s now possible to add client-only directives to queries by adding them to the `cacheExchange`’s new `directives` option.
Directives accept an object of their arguments and return a resolver. When a field is annotated with
a resolver, e.g. `@_optional` or `@_required`, their resolvers from the `directives` config are
executed. This means it’s now possible to use `@_relayPagination` for example, by passing adding
the `relayPagination` helper to the config.
Due to the change in [#3317](https://github.com/urql-graphql/urql/pull/3317), any directive in
queries that’s prefixed with an underscore (`_`) is only visible to Graphcache and not the API.

See: https://github.com/urql-graphql/urql/pull/3306
