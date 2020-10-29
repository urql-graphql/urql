---
'@urql/exchange-graphcache': patch
'@urql/core': patch
'@urql/preact': patch
'urql': patch
---

Fix the production build overwriting the development build. Specifically in the previous release we mistakenly replaced all development bundles with production bundles. This doesn't have any direct influence on how these packages work, but prevented development warnings from being logged or full errors from being thrown.
