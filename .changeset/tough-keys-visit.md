---
'@urql/exchange-graphcache': patch
---

Update `cache.resolve(parent, ...)` case to enable _even more_ cases, for instance where `parent.__typename` isn't set yet. This was intended to be enabled in the previous patch but has been forgotten.
