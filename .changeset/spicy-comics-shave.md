---
'@urql/exchange-graphcache': patch
---

Fix reference equality not being preserved. This is a fix on top of [#3165](https://github.com/urql-graphql/urql/pull/3165), and was previously not addressed to avoid having to test for corner cases that are hard to cover. If you experience issues with this fix, please let us know.
