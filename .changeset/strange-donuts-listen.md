---
'@urql/svelte': minor
---

Refactor all operations to allow for more use-cases which preserve state and allow all modes of Svelte to be applied to urql.

```
// Standard Usage:
mutate({ query, variables })()

// Subscribable Usage:
$: result = mutate({ query, variables });

// Curried Usage
const executeMutation = mutate({ query, variables });
const onClick = () => executeMutation();

// Curried Usage with overrides
const executeMutation = mutate({ query });
const onClick = () => await executeMutation({ variables });

// Subscribable Usage (as before):
$: result = query({ query: TestQuery, variables });

// Subscribable Usage which preserves state over time:
const testQuery = query({ query: TestQuery });
// - this preserves the state even when the variables change!
$: result = testQuery({ variables });

// Promise-based callback usage:
const testQuery = query({ query: TestQuery });
const doQuery = async () => await testQuery;

// Promise-based usage updates the subscribables!
const testQuery = query({ query: TestQuery });
const doQuery = async () => await testQuery;
// - doQuery will also update this result
$: result = query({ query: TestQuery, variables });
```
