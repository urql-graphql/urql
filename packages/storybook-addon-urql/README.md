# Storybook Addon Urql

Easily create fixtures with all the states of your GraphQL requests.

## Installation

```sh
npm i storybook-addon-urql
```

## Usage

Add the addon to your config file at `.storybook/main`

```js
module.exports = {
  stories: ['../src/**/*.stories.*'],
  addons: ['storybook-addon-urql'],
};
```

Mock states by using the `urql` parameter on your stories.

```tsx
export const MyStory = () => <Users />;

MyStory.parameters = {
  urql: () => ({ data: { user: { id: 1234, name: 'Steve' } } }),
};
```

## Examples

### Fetching state

Setting a query in an infinitely fetching state.

```tsx
MyStory.parameters = {
  urql: () => new Promise(() => {}),
};
```

### Error state

Returning an error for a query.

```tsx
MyStory.parameters = {
  urql: () => ({ errors: ['Some error'] }),
};
```

### Single response

Returning data for a query (single request).

```tsx
MyStory.parameters = {
  urql: () => ({ data: { user: { id: 1234, name: 'Steve' } } }),
};
```

### Multiple queries

Returning data for multiple queries (conditional response).

```tsx
MyStory.parameters = {
  urql: op => {
    if (getQueryName(op.query) === 'GetUser') {
      return { data: { user: { id: 1234, name: 'Steve' } } };
    }

    if (getQueryName(op.query) === 'GetFeed') {
      return { data: { feed: [{ id: 1, title: 'Fake news' }] } };
    }
  },
};
```
