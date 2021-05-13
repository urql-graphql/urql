---
'@urql/exchange-request-policy': patch
---

Fix TTL being updated to a newer timestamp when a cached result comes in, and prevent TTL from being deleted on our React binding's cache probes. Instead we now never delete the TTL and update it on incoming cache miss results.
