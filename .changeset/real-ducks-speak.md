---
'@urql/exchange-graphcache': patch
---

Fix a typo that caused an inverted condition, for checking owned data, to cause incorrect results when handling `null` values and encountering them first.
