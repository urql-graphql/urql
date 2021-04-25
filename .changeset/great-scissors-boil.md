---
'@urql/exchange-graphcache': patch
---

list-items are never nullable when we aren't using schema-awareness, this would otherwise lead to scenario's where we don't refetch partial results. Formerly we made the assumption that a list-item was nullable when we weren't provided with a schema, this meant that if we'd provide `[undefined, 'entity:x']` from a resolver we wouldn't fetch the result but we'd return it.
