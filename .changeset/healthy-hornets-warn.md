---
'@urql/exchange-execute': patch
---

End iterator when teardown functions runs, previously it waited for one extra call to next, then ended the iterator
