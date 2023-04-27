---
'@urql/exchange-persisted': patch
---

Update the `preferGetForPersistedQueries` option to include the `'force'` and `'within-url-limit'` values from the Client's `preferGetMethod` option. The default value of `true` no longer sets `OperationContext`'s `preferGetMethod` setting to `'force'`. Instead, the value of `preferGetForPersistedQueries` carries through to the `OperationContext`'s `preferGetMethod` setting for persisted queries.
