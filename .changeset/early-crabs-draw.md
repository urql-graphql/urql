---
'@urql/core': patch
---

move `multipart/mixed` to the last `Accept` header to avoid breaking
`react-native-fetch`
