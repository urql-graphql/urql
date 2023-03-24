---
'@urql/exchange-graphcache': patch
---

Use `stringifyDocument` in `offlineExchange` rather than `print` and serialize `operation.extensions` as needed.
