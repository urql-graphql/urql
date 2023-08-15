---
'@urql/exchange-graphcache': patch
---

Fix extra variables in mutation results regressing by a change made in [#3317](https://github.com/urql-graphql/urql/pull/3317). The original operation wasn't being preserved anymore.
