---
'@urql/exchange-graphcache': patch
---

Graphcache's `optimistic` option now accepts optimistic mutation resolvers that return fields by
name rather than alias. Previously, depending on which mutation was run, the optimistic resolvers
would read your optimistic data by field alias (i.e. "alias" for `alias: id` rather than "id").
Instead, optimistic updates now correctly use field names and allow you to also pass resolvers as
values on your optimistic config.
