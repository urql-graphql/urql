---
'@urql/core': patch
---

Fix issue where a reexecute on an in-flight operation would lead to multiple network-requests.
This issue was observable when using graphcache on pages where we'd have multiple queries that are inter-dependent, i.e.
they shared entities that had queries running in parallel, one of them completing would result in
graphcache calling `reexecute` while the other ones were still in-flight leading to duplicate network requests.
