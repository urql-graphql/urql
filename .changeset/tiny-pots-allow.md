---
'@urql/core': patch
---

Fix issue where a reexecute on an in-flight operation would lead to multiple network-requests.
For example, this issue presents itself when Graphcache is concurrently updating multiple, inter-dependent queries with shared entities. One query completing while others are still in-flight may lead to duplicate operations being issued.
