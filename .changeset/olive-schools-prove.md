---
'@urql/core': patch
---

Support non spec-compliant error bodies, i.e. the Shopify API does return `errors` but as an object. Adding
a check whether we are really dealing with an Array of errors enables this.
