---
'@urql/exchange-graphcache': patch
---

Fix small pieces of code where polyfill-less ES5 usage was compromised. This was unlikely to have affected anyone in production as `Array.prototype.find` (the only usage of an ES6 method) is commonly used and polyfilled.
