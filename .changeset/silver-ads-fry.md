---
'@urql/exchange-auth': patch
'@urql/exchange-execute': patch
'@urql/exchange-graphcache': patch
'@urql/exchange-multipart-fetch': patch
'@urql/exchange-persisted-fetch': patch
'@urql/exchange-populate': patch
'@urql/exchange-refocus': patch
'@urql/exchange-request-policy': patch
'@urql/exchange-retry': patch
'@urql/core': patch
'@urql/introspection': patch
'next-urql': patch
'@urql/preact': patch
'urql': patch
'@urql/storybook-addon': patch
'@urql/svelte': patch
'@urql/vue': patch
---

Extend peer dependency range of `graphql` to include `^16.0.0`.
As always when upgrading across many packages of `urql`, especially including `@urql/core` we recommend you to deduplicate dependencies after upgrading, using `npm dedupe` or `npx yarn-deduplicate`.
