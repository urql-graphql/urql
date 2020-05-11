## Subscriptions example

This is a basic example of subscriptions being used with `urql`. It demonstrates some of the core principles around wiring up subscriptions, including:

- Setting up the `subscriptionExchange` with a `subscriptionClient`.
- Using the `useSubscription` hook.
- Using a `handler` to accumulate the results of subscriptions.

## Usage

#### 1. Navigate to the example directory and install dependencies

```bash
cd packages/react-urql/examples/2-using-subscriptions
yarn
```

#### 2. Start server

```bash
yarn start
```

#### 3. Open your browser

Navigate to example at [http://localhost:4000/](http://localhost:4000/).
