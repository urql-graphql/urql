---
'@urql/exchange-retry': patch
---

---

## '@urql/exchange-retry': patch

Fixed the delay amount not increasing as retry count increases. This was the result of
the `retry.delay` value not being persisted in the operation context.

This change also adds a unit test for the expected behaviour of the non-random delay
increasing linearly as the retry count increases.
