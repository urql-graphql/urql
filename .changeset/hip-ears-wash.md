---
'@urql/core': patch
urql: patch
---

Fix missing React updates after an incoming response that schedules a mount. We now prevent dispatched operations from continuing to flush synchronously when the original source that runs the queue has terminated. This is important for the React bindings, because an update (e.g. `setState`) may recursively schedule a mount, which then disabled other `setState` updates from being processed. Previously we assumed that React used a trampoline scheduler for updates, however it appears that `setState` can recursively start more React work.
