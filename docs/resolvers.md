# Resolvers

This is a way to alter the response you'll receive from the cache,
so let's look at an example to get a better understanding.

```js
const cache = cacheExchange({
  resolvers: {
    Todo: { text: () => 'Secret' },
  },
});
```

Now when we query our `todos` every time we encounter an object with `Todo`
as the `__typename` it will change the `text` to `secret`. So here we
effectively change how we handle a certain property on an entity.

This looks pretty useless right now but let's look at what arguments
are passed to this method so we can get a better understanding.

A resolver gets four arguments:

- parent: in this case the result of the `Todo` up until us getting `text`
- arguments: the arguments used in this field.
- cache: this is the normalised cache, this cache provides us with a `resolve` method
  more about this underneath.
- info: contains the fragments used in the query and the field arguments in the query.

The `cache.resolve` method is used to get links and property values from the cache,
our cache methods has three arguments:

- entity: this can either be an object containing a `__typename` and an `id` or `_id`.
  This argument however can also be a string, this will be a key leading to a cached entity.
- field: the field you want data for, this can be a relation or a single property.
- arguments: the arguments to include on the field.

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

When we would use `resolve` to get the author it would look like this:

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

Now we have a stringed key that indicates our author, now we
can use this to derive the name of our author.

```js
const name = cache.resolve('Author:2', 'name');
console.log(name); // 'Bar'
```

This can solve practical use cases like for example date formatting,
you can query the date and then convert it in your resolver.

[Back](../README.md)
