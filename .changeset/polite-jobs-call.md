---
'@urql/exchange-graphcache': patch
---

Fix regression from [#1869](https://github.com/FormidableLabs/urql/pull/1869) that caused nullable lists to always cause a cache miss, if schema awareness is enabled.
