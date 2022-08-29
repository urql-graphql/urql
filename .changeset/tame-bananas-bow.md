---
'@urql/exchange-graphcache': patch
---

Adjust timing of when an introspected schema will be processed into field maps, interface maps, and union type maps. By making this lazy we can avoid excessive work when these maps aren't actually ever used.
