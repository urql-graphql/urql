# SSR with Next.js Example

This is a basic server-side rendering example with Next.js
In an actual app you can reuse most of this code and
structure, except for `next.config.js`, which is only
set up to alias local dependencies to avoid deduplication.

> _Note:_ This example is based on next.js'
> [`withApollo` example.](https://github.com/zeit/next.js/tree/canary/examples/with-apollo)

## Usage

#### 1. Navigate to the example directory and install dependencies

```bash
cd packages/react-urql/examples/3-ssr-with-nextjs
yarn
```

#### 2. Start server

```bash
yarn dev
```

#### 3. Open browser

Navigate to example at [http://localhost:3000/](http://localhost:3000/).
