---
'@urql/core': patch
---

Fix `client.reexecuteOperation` letting every second reexecute of an in-flight operation through. The in-flight block cleared the operation's `dispatched` flag, so the next reexecute during the same request passed the deduplication check and sent a second network request. The flag is now only cleared when the reexecute replaced an operation that was already waiting in the queue.
