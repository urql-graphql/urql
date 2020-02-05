# Populate Exchange

`populate` is an exchange for auto-populating fields in your mutations.

## How to use

As with any exchange, add this to your client.

> Note: Populate needs to be declared before the cache in order to ensure the `populate` directive is replaced with the respective attributes.

```tsx
import { populateExchange } from '@urql/exchange-graphcache';

const client = createClient({
  // ...
  exchanges: [dedupExchange, populateExchange, cacheExchange, fetchExchange],
})
```

## Example usage

Consider the following queries which have been requested in other parts of your application:


```graphql
# Query 1
{
  todos {
    id
    name
  }
} 

# Query 2
{
  todos {
    id
    createdAt
  }
}
```

Without the `populateExchange` you may write a mutation like the following which returns a newly created todo item:

```graphql
# Without populate
mutation addTodo(id: ID!) {
  addTodo(id: $id) {
    id        # To update Query 1 & 2
    name      # To update Query 1
    createdAt # To update Query 2
  }
}
```

By using `populateExchange`, you no longer need to manually specify the selection set required to update your other queries. Instead you can just add the `@populate` directive.

```graphql
# With populate
mutation addTodo(id: ID!) {
  addTodo(id: $id) @populate
}
```

> Note: The above two mutations produce an identical GraphQL request.

### Choosing when to populate

You may not want to populate your whole mutation response. In order to reduce your payload, pass populate lower in your query.

```graphql
mutation addTodo(id: ID!) {
  addTodo(id: $id) {
    id
    user @populate
  }
}
```

### Using aliases

If you find yourself using multiple queries with variables, it may be necessary to [use aliases](https://graphql.org/learn/queries/#aliases) in order to allow merging of queries.

**Invalid usage**
```graphql
# Query 1
{
  todos(first: 10) {
    id
    name
  }
} 

# Query 2
{
  todos(last: 20) {
    id
    createdAt
  }
}
```

**Usage with aliases**
```graphql
# Query 1
{
  firstTodos: todos(first: 10) {
    id
    name
  }
} 

# Query 2
{
  lastTodos: todos(last: 20) {
    id
    createdAt
  }
}
```
