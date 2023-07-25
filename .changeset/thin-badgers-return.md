---
'@urql/exchange-graphcache': minor
---

Allow `cache.resolve` to return `undefined` when a value is not cached to make it easier to cause a cache miss in resolvers. **Reminder:** Returning `undefined` from a resolver means a field is uncached, while returning `null` means that a field’s value is `null` without causing a cache miss.
