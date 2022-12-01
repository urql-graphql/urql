---
'@urql/core': patch
---

Update to `wonka@^6.1.2` to fix memory leak in `fetch` caused in Node.js by a lack of clean up after initiating a request.
