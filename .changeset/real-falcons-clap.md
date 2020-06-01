---
'@urql/exchange-execute': patch
'@urql/exchange-graphcache': patch
'@urql/exchange-multipart-fetch': patch
'@urql/exchange-persisted-fetch': patch
'@urql/exchange-populate': patch
'@urql/exchange-retry': patch
'@urql/exchange-suspense': patch
'@urql/core': patch
'@urql/preact': patch
'urql': patch
'@urql/svelte': patch
---

Upgrade to a minimum version of wonka@^4.0.14 to work around issues with React Native's minification builds, which use uglify-es and could lead to broken bundles.
