---
'@urql/core': patch
---

Prevent ignored characters in GraphQL queries from being replaced inside strings and block strings. Previously we accepted sanitizing strings via regular expressions causing duplicate hashes as acceptable, since it'd only be caused when a string wasn't extracted into variables. This is fixed now however.
