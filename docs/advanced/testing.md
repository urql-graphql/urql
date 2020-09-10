---
title: Testing
order: 7
---

# Testing

Testing with `urql` can be done in a multitude of ways. The most effective and straightforward
method is to mock the `Client` to force your components into a fixed state during testing.

The following examples demonstrate this method of testing for React and the `urql` package only,
however the pattern itself can be adapted for any framework-bindings of `urql`.

## Mocking the client

For the most part, urql's hooks are just adapters for talking to the urql client.

The way in which they do this is by making calls to the client via context.

- `useQuery` calls `executeQuery`
- `useMutation` calls `executeMutation`
- `useSubscription` calls `executeSubscription`

In the section [Stream Patterns](../concepts/stream-patterns.md) we've seen, that all methods on the client operate with and return streams. These streams are created using the [Wonka](../concepts/stream-patterns.md#the-wonka-library) library and we're able to create streams ourselves to mock the different states of our operations, e.g. fetching, errors, or success with data.

You'll probably use one of these utility functions to create streams:

- `never`: This stream doesn’t emit any values and never completes, which puts our `urql` code in a permanent `fetching: true` state.
- `fromValue`: This utility function accepts a value and emits it immediately, which we can use to mock a result from the server.
- `makeSubject`: Allows us to create a source and imperatively push responses, which is useful to test subscription and simulate changes, i.e. multiple states.

Creating a mock `Client` is pretty quick as we'll create an object that contains the `Client`'s methods that the React `urql` hooks use. We'll mock the appropriate `execute` functions that we need to mock a set of hooks. After we've created the mock `Client` we can wrap components with the `Provider` from `urql` and pass it.

Here's an example client mock being used while testing a component.

```tsx
import { mount } from 'enzyme';
import { Provider } from 'urql';
import { never } from 'wonka';
import { MyComponent } from './MyComponent';

const mockClient = {
  executeQuery: jest.fn(() => never),
  executeMutation: jest.fn(() => never),
  executeSubscription: jest.fn(() => never),
};

it('renders', () => {
  const wrapper = mount(
    <Provider value={mockClient}>
      <MyComponent />
    </Provider>
  );
});
```

## Testing calls to the client

Once you have your mock setup, calls to the client can be tested.

```tsx
it('skips the query', () => {
  mount(
    <Provider value={mockClient}>
      <MyComponent skip={true} />
    </Provider>
  );
  expect(mockClient.executeQuery).toBeCalledTimes(0);
});
```

Testing mutations and subscriptions also work in a similar fashion.

```tsx
it('triggers a mutation', () => {
  const wrapper = mount(
    <Provider value={mockClient}>
      <MyComponent />
    </Provider>
  );
  const variables = {
    name: 'Carla',
  };

  wrapper.find('input').simulate('change', { currentTarget: { value: variables.name } });
  wrapper.find('button').simulate('click');

  expect(mockClient.executeMutation).toBeCalledTimes(1);
  expect(mockClient.executeMutation).toBeCalledWith(expect.objectContaining({ variables }));
});
```

## Forcing states

For testing render output, or creating fixtures, you may want to force the state of your components.

### Fetching

Fetching states can be simulated by returning a stream which never returns. Wonka provides a utility for this, aptly called `never`.

Here's a fixture which stays in the _fetching_ state.

```tsx
import { Provider } from 'urql';
import { never } from 'wonka';
import { MyComponent } from './MyComponent';

const fetchingState = {
  executeQuery: () => never,
};

export default (
  <Provider value={fetchingState}>
    <MyComponent />
  </Provider>
);
```

### Response (success)

Response states are simulated by providing a stream which contains a network response. For single responses, Wonka's `fromValue` function can do this for us.

**Example snapshot test of response state**

```tsx
const responseState = {
  executeQuery: () =>
    fromValue({
      data: {
        posts: [
          { id: 1, title: 'Post title', content: 'This is a post' },
          { id: 3, title: 'Final post', content: 'Final post here' },
        ],
      },
    }),
};

it('matches snapshot', () => {
  const wrapper = mount(
    <Provider value={responseState}>
      <MyComponent />
    </Provider>
  );
  expect(wrapper).toMatchSnapshot();
});
```

### Response (error)

Error responses are similar to success responses, only the value in the stream is changed.

```tsx
import { Provider, CombinedError } from 'urql';

const errorState = {
  executeQuery: () =>
    fromValue({
      error: new CombinedError({
        networkError: Error('something went wrong!'),
      }),
    }),
};
```

### Handling multiple hooks

Returning different values for many `useQuery` calls can be done by introducing conditionals into the mocked client functions.

```tsx
const mockClient = () => {
  executeQuery: ({ query }) => {
    if (query === GET_USERS) {
      return fromValue(usersResponse);
    }

    if (query === GET_POSTS) {
      return fromValue(postsResponse);
    }
  };
};
```

The above client we've created mocks all three operations — queries, mutations, and subscriptions — to always remain in the `fetching: true` state.

## Subscriptions

Testing subscriptions can be done by simulating the arrival of new data over time. To do this we may use the `interval` utility from Wonka, which emits values on a timer, and for each value we can map over the response that we'd like to mock.

If you prefer to have more control on when the new data is arriving you can use the `makeSubject` utility from Wonka. You can see more details in the next section.

Here's an example of testing a list component which uses a subscription.

```tsx
const mockClient = {
  executeSubscription: jest.fn(query =>
    pipe(
      interval(200),
      map((i: number) => ({
        // To mock a full result, we need to pass a mock operation back as well
        operation: {
          operationName: 'subscription,
          context: {},
          ...query,
        },
        data: { posts: { id: i, title: 'Post title', content: 'This is a post' } },
      }))
    )
  ),
};

it('should update the list', done => {
  let index = 0;

  const wrapper = mount(
    <Provider value={mockClient}>
      <MyComponent />
    </Provider>
  );

  setTimeout(() => {
    expect(wrapper.find('.list').children()).toHaveLength(index + 1); // See how many items are in the list
    index++;
    if (index === 2) done();
  }, 200);
});
```

## Simulating changes

Simulating multiple responses can be useful, particularly testing `useEffect` calls dependent on changing query responses.

For this, a _subject_ is the way to go. In short, it's a stream which you can push responses to. The `makeSubject` function from Wonka is what you'll want to use for this purpose.

Below is an example of simulating subsequent responses (such as a cache update/refetch) in a test.

```tsx
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { Provider } from 'urql';
import { makeSubject } from 'wonka';
import { MyComponent } from './MyComponent';

const { source: stream, next: pushResponse } = makeSubject();

const mockedClient = {
  executeQuery: jest.fn(() => stream),
};

it('shows notification on updated data', () => {
  const wrapper = mount(
    <Provider value={mockedClient}>
      <MyComponent />
    </Provider>
  );

  // First response
  act(() => {
    pushResponse({
      data: {
        posts: [{ id: 1, title: 'Post title', content: 'This is a post' }],
      },
    });
  });
  expect(wrapper.find('dialog').exists()).toBe(false);

  // Second response
  act(() => {
    pushResponse({
      data: {
        posts: [
          { id: 1, title: 'Post title', content: 'This is a post' },
          { id: 1, title: 'Post title', content: 'This is a post' },
        ],
      },
    });
  });
  expect(wrapper.find('dialog').exists()).toBe(true);
});
```
