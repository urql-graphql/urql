---
'@urql/exchange-graphcache': patch
'@urql/core': patch
'@urql/next': patch
---

Remove the invalid `exports` field from the generated subpath `package.json` files (e.g. `@urql/exchange-graphcache/extras`, `@urql/exchange-graphcache/default-storage`, `@urql/core/internal`, `@urql/next/rsc`). These targets pointed at the parent `dist/` directory (`../dist/...`), which violates the Node.js package-exports spec requirement that every `exports` target begin with `./`. Metro (Expo 53 / React Native 0.79) validates this and logged a warning for every affected package. Subpath resolution continues to work: `exports`-aware bundlers resolve through the root `package.json`, while legacy resolution relies on the `main`/`module`/`types` fields that remain in place.
