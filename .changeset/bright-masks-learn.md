---
'@urql/core': patch
---

cut off `url` when using the GET method at 2048 characters (lowest url-size coming from chromium)
