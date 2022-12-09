---
'@urql/exchange-graphcache': patch
---

Fix operation being blocked for looping due to it not cancelling the looping protection when a `teardown` is received. This bug could be triggered when a shared query operation triggers again and causes a cache miss (e.g. due to an error). The re-execution of the operation would then be blocked as Graphcache considered it a "reexecution loop" rather than a legitimate execution triggered by the UI. (See https://github.com/urql-graphql/urql/pull/2737 for more information)
