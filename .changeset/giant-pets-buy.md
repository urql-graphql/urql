---
'@urql/exchange-persisted': major
'@urql/core': major
---

By default leverage GET for queries where the query-string + variables comes down to less than 2048 characters.
When upgrading it's important to see whether your server supports `GET`, if it doesn't ideally adding support for it
or alternatively setting `preferGetMethod` in the `createClient` method as well as `preferGetForPersistedQueries` for
the persisted exchange to `false`.
