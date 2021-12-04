---
'@urql/exchange-retry': patch
---

Fix operations sometimes not being executed after a retry is supposed to be triggered, due to a `setTimeout` reordering issue when the timer isn't as predictable as it should be.
