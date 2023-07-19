---
'@urql/core': minor
---

Update `formatDocument` to output `FormattedNode` type mapping. The formatter will now annotate added `__typename` fields with `_generated: true`, place selection nodes' directives onto a `_directives` dictionary, and will filter directives to not include `"_"` underscore prefixed directives in the final query. This prepares us for a feature that allows enhanced client-side directives in Graphcache.
