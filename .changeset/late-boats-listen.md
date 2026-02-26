---
'@urql/solid-start': minor
---

Fix SSR runtime failures caused by importing SolidStart's `action` API at module load time by reading `action` from `Provider` context instead.
