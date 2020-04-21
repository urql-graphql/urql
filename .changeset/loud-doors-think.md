---
'@urql/core': patch
'@urql/exchange-graphcache': patch
---

Make the extension of the main export unknown, which fixes a Webpack issue where the resolver won't pick `module` fields in `package.json` files once it's importing from another `.mjs` file.
