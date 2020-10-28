---
'@urql/exchange-auth': patch
'@urql/exchange-execute': patch
'@urql/exchange-graphcache': patch
'@urql/exchange-multipart-fetch': patch
'@urql/exchange-persisted-fetch': patch
'@urql/exchange-populate': patch
'@urql/exchange-refocus': patch
'@urql/exchange-retry': patch
'@urql/exchange-suspense': patch
'@urql/core': minor
'urql': patch
---

Deprecate the `Operation.operationName` property in favor of `Operation.kind`. This name was
previously confusing as `operationName` was effectively referring to two different things. You can
safely upgrade to this new version, however to mute all deprecation warnings you will have to
**upgrade** all `urql` packages you use. If you have custom exchanges that spread operations, please
use [the new `makeOperation` helper
function](https://formidable.com/open-source/urql/docs/api/core/#makeoperation) instead.
