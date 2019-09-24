# Resolvers

`resolvers` are a way to alter the response you'll receive from the cache.
Let's look at an example to get a better understanding.

```js
const cache = cacheExchange({
  resolvers: {
    Todo: { text: () => 'Secret' },
  },
});
```

Now when we query our `todos` every time we encounter an object with `Todo`
as the `__typename` it will change the `text` to `'Secret'`. In this way we
can effectively change how we handle a certain property on an entity.

This may seem pretty useless right now, but let's look at the arguments
passed to `resolvers` to get a better sense of how powerful they are.

A `resolver` gets four arguments:

- `parent` – The original entity in the cache. In the example above, this
  would be the full `Todo` object.
- `arguments` – The arguments used in this field.
- `cache` – This is the normalized cache. The cache provides us with `resolve`, `readQuery` and `readFragment` methods;
  see more about this [below](#cache.resolve).
- `info` – This contains the fragments used in the query and the field arguments in the query.

## `cache.resolve`

The `cache.resolve` method is used to get links and property values from the cache.
Our cache methods have three arguments:

- `entity` – This can either be an object containing a `__typename` and an `id` or
  `_id` field _or_ a string key leading to a cached entity.
- `field` – The field you want data for. This can be a relation or a single property.
- `arguments` – The arguments to include on the field.

To get a better grasp let's look at a few examples.
Consider the following data structure:

```js
todos: [
  {
    id: '1',
    text: 'Install urql',
    complete: true,
    author: { id: '2', name: 'Bar' },
  },
  {
    id: '2',
    text: 'Learn urql',
    complete: true,
    author: { id: '1', name: 'Foo' },
  },
];
```

Using `cache.resolve` to get the author would look like this:

```js
const parent = {
  id: '1',
  text: 'Install urql',
  complete: true,
  author: undefined,
  __typename: 'Todo',
};
const result = cache.resolve(parent, 'author');
console.log(result); // 'Author:2'
```

Now we have a stringed key that identifies our author. We
can use this to derive the name of our author.

```js
const name = cache.resolve('Author:2', 'name');
console.log(name); // 'Bar'
```

This can help solve practical use cases like date formatting,
where you would query the date and then convert it in your resolver.

## `cache.readQuery`

Another method the cache allows is to let you read a full query, this method
accepts an object of `query` and optionally `variables`.

```js
const data = cache.readQuery({ query: Todos, variables: { from: 0, limit: 10 } })`
```

This way we'll get the stored data for the `TodosQuery` with given variables.

## `cache.readFragment`

The store allows the user to also read a fragment for a certain entity, this function
accepts a `fragment` and an `id`. This looks like the following.

```js
const data = cache.readFragment(gql`
  fragment _ on Todo {
    id
    text
  }
`, '1'`;
```

This way we'll get the Todo with id 1 and the relevant data we are askng for in the
fragment.

[Back](../README.md)
