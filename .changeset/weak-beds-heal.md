---
'@urql/exchange-graphcache': patch
---

Ensure that pagination helpers don't confuse pages that have less params with a
query that has more params.
See: [#156](https://github.com/FormidableLabs/urql-exchange-graphcache/pull/156)
