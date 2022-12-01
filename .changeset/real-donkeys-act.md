---
'@urql/core': patch
---

Replace fetch source implementation with async generator implementation, based on Wonka's `fromAsyncIterable`. This will bump `wonka` to `^6.1.1`. To prevent duplication of `wonka`, check whether you have two versions installed after upgrading.
