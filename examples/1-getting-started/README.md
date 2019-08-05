## About

This is a basic todo app built with `urql`. It demonstrates some of the core principles of the framework, including:

- Creating a `client`.
- Wrapping your app with `Provider`.
- Using the `useQuery` hook to execute and refetch queries.
- Using the `useMutation` hook to execute mutations.
- Showing the [devtools](https://chrome.google.com/webstore/detail/urql-devtools/mcfphkbpmkbeofnkjehahlmidmceblmm)

## Usage

#### 1. Install dependencies in repo root.

To get started with the example, make sure to install `urql`'s dependencies in the root directory of your clone. We `link` to the `urql` source from the `examples` directory, so its dependencies need to be installed.

```bash
# In root directory
yarn
```

#### 2. Navigate to this directory and install dependencies.

```bash
cd examples/1-getting-started
yarn
```

#### 3. Start the example app and server (this is done in a single command).

```bash
yarn start
```

#### 4. Open your browser

Navigate to example at [http://localhost:3000/](http://localhost:3000/). You can use the urql devtools by
opening your console and navigating to the `urql` tab.
