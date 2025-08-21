---
'@urql/exchange-graphcache': patch
'@urql/exchange-auth': patch
'@urql/core': patch
---

Use actual values instead of omitting the setTimeout delay since leaving it out emits a warning in the bun runtime. Replaced all omitted calls with the default value 1
