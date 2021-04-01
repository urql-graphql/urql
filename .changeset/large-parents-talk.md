---
'next-urql': patch
---

Ensure `urqlState` is hydrated onto the client when a user opts out of `ssr` and uses the `getServerSideProps` or `getStaticProps` on a page-level and `withUrqlClient` is wrapped on an `_app` level.

Examples:

- [getStaticProps](https://codesandbox.io/s/urql-get-static-props-dmjch?file=/pages/index.js)
- [getServerSideProps](https://codesandbox.io/s/urql-get-static-props-forked-xfbrs?file=/pages/index.js)
