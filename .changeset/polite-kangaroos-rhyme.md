---
'@urql/exchange-auth': patch
---

`authExchange()` will now block and pass on errors if the initialization function passed to it fails, and will retry indefinitely. It’ll also output a warning for these cases, as the initialization function (i.e. `authExchange(async (utils) => { /*...*/ })`) is not expected to reject/throw.
