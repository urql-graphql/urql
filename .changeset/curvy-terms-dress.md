---
'@urql/core': patch
---

Don't return `undefined` in the serialized ssr-result, this would crash in Next.JS
