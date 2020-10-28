---
'@urql/preact': patch
'@urql/exchange-execute': patch
'@urql/exchange-graphcache': patch
'@urql/exchange-populate': patch
'@urql/core': patch
'@urql/introspection': patch
---

Add missing `.mjs` extension to all imports from `graphql` to fix Webpack 5 builds, which require extension-specific import paths for ESM bundles and packages. **This change allows you to safely upgrade to Webpack 5.**
