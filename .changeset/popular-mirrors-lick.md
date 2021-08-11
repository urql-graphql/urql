---
'@urql/core': patch
---

The [single-source behavior previously](https://github.com/FormidableLabs/urql/pull/1515) wasn't effective for implementations like React,
where the issue presents itself when the state of an operation is first polled. This led to the operation being torn down erroneously.

We now ensure that operations started at the same time still use a shared single-source.
