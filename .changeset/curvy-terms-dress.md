---
'@urql/core': patch
---

Don't add `undefined` to any property of the `ssrExchange`'s serialized results, as this would crash in Next.js
