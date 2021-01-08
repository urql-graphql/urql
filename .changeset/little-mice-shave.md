---
"@urql/preact": patch
"urql": patch
---

Fix Suspense when results share data, this would return partial results for graphCache and not update to the eventual data
