---
'urql': patch
---

Fix issue where a paused query would not behave correctly when calling `executeQuery`, this scenario occured when the query has variables, there would be cases where on the first call it would think that the dependencies had changed (previous request vs current request) which made the source reset to null
