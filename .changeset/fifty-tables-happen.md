---
'@urql/core': patch
---

Fix incorrect JSON stringification of objects from different JS contexts. This could lead to invalid variables being generated in the Vercel Edge runtime specifically.
