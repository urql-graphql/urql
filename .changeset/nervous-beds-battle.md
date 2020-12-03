---
'@urql/exchange-graphcache': patch
---

Replace `graphql/utilities/buildClientSchema.mjs` with a custom-tailored, lighter implementation built into `@urql/exchange-graphcache`. This will appear to increase its size by about `0.5kB gzip` but will actually save around `-5.8kB gzip` in any production bundle by using less of `graphql`'s code.
