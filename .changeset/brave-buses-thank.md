---
'@urql/next': patch
---

Fix `CVE-2024-24556`, addressing an XSS vulnerability, where `@urql/next` failed to escape HTML characters in JSON payloads injected into RSC hydration bodies. When an attacker is able to manipulate strings in the JSON response in RSC payloads, this could cause HTML to be evaluated via a typical XSS vulnerability (See [`GHSA-qhjf-hm5j-335w`](https://github.com/urql-graphql/urql/security/advisories/GHSA-qhjf-hm5j-335w) for details.)
