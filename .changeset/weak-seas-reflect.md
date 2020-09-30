---
'next-urql': major
---

Remove the automatic polyfilling of `fetch` since this is done automatically starting at
[`Next v9.4`](https://nextjs.org/blog/next-9-4#improved-built-in-fetch-support)

If you are using a version before 9.4 you can upgrade by installing [`isomorphic-unfetch`](https://www.npmjs.com/package/isomorphic-unfetch)
and importing it to polyfill the behavior.
