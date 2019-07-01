## About

This is a basic example of subscriptions being used with `urql`. It demonstrates some of the core principles around wiring up subscriptions, including:

- Setting up the `subscriptionExchange` with a `subscriptionClient`.
- Using the `useSubscription` hook.
- Using a `handler` to accumulate the results of subscriptions.

## Usage

#### 1. Install dependencies in repo root.

To get started with the example, make sure to install `urql`'s dependencies in the root directory of your clone. We `link` to the `urql` source from the `examples` directory, so its dependencies need to be installed.

```bash
# In root directory
yarn
```

#### 2. Navigate to this directory and install dependencies.

```bash
cd examples/2-using-subscriptions
yarn
```

#### 3. Start the example app and server (this is done in a single command).

```bash
yarn start
```

#### 4. Open your browser

Navigate to example at [http://localhost:3000/](http://localhost:3000/).
