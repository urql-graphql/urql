---
'next-urql': patch
---

Fix issue where the `renderToString` pass would keep looping due to reexecuting operations on the server
