---
'@urql/core': minor
---

With the "single-source behavior" the `Client` will now also avoid executing an operation if it's already active, has a previous result available, and is either run with the `cache-first` or `cache-only` request policies. This is similar to a "short circuiting" behavior, where unnecessary work is avoided by not issuing more operations into the exchange pipeline than expected.
