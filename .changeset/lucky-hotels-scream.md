---
'@urql/exchange-graphcache': patch
---

Prevent variables from being filtered and queries from being altered before they're forwarded, which prevented additional untyped variables from being used inside updater functions.
