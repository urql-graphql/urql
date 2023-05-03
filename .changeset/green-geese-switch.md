---
'@urql/core': patch
---

Don't allow `isSubscriptionOperation` option in `subscriptionExchange` to include `teardown` operations, to avoid confusion.
