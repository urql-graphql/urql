---
'@urql/exchange-graphcache': patch
'@urql/preact': patch
'urql': patch
'@urql/svelte': patch
---

Forcefully bump @urql/core package in all bindings and in @urql/exchange-graphcache.
We're aware that in some cases users may not have upgraded to @urql/core, even though that's within
the typical patch range. Since the latest @urql/core version contains a patch that is required for
`cache-and-network` to work, we're pushing another patch that now forcefully bumps everyone to the
new version that includes this fix.
