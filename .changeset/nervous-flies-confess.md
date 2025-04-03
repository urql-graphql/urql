---
'@urql/core': patch
---

Fix `fetchSource` not text-decoding response chunks as streams, which could cause UTF-8 decoding to break.
