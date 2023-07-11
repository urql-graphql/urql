---
'@urql/exchange-graphcache': patch
---

Allow `offlineExchange` to once again issue all request policies, instead of mapping them to `cache-first`. When replaying operations after rehydrating it will now prioritise network policies, and before rehydrating receiving a network result will prevent a network request from being issued again.
