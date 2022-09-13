# Urql Storybook Addon

Create fixtures to model all the states of your GraphQL requests with Urql.

## Installation

```sh
npm i -D @urql/storybook-addon
```

## Usage

Add the decorator in your preview file at `.storybook/preview`

```tsx
import { addDecorator } from '@storybook/react';
import { urqlDecorator } from '@urql/storybook-addon';

addDecorator(urqlDecorator);
```

Mock states by using the `urql` parameter on your stories.

```tsx
export const MyStory: Story = () => <Users />;

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
import { getOperationName } from 'urql';

MyStory.parameters = {
  urql: op => {
    if (getOperationName(op.query) === 'GetUser') {
      return { data: { user: { id: 1234, name: 'Steve' } } };
    }

    if (getOperationName(op.query) === 'GetFeed') {
      return { data: { feed: [{ id: 1, title: 'Fake news' }] } };
    }
  },
};
```
