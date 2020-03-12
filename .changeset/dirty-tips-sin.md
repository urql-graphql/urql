---
'next-urql': patch
---

Pass the urqlClient down in withUrqlClient.getInitialProps to prevent it from being called twice.
