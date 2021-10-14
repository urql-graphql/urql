---
'@urql/core': patch
---

Prevent `Buffer` from being polyfilled by an automatic detection in Webpack. Instead of referencing the `Buffer` global we now simply check the constructor name.
