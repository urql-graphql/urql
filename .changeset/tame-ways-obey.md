---
'@urql/exchange-graphcache': patch
---

Fix cases where `ResolveInfo`’s `parentFieldKey` was incorrectly populated with a key that isn’t a field key (allowing for `cache.resolve(info.parentKey, info.parentFieldKey)` to be possible) but was instead set to `info.parentKey` combined with the field key.
