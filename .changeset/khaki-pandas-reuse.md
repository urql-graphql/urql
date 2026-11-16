---
'@urql/core': patch
---

Only reuse a document's original source in `stringifyDocument` if it was created from a urql request string. Documents provided by an external loader that contain additional definitions are printed from their AST again, so a request for a single operation no longer includes the other operations in the document.
