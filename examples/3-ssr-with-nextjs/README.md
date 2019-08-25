# SSR with Next.js Example

This is a basic server-side rendering example with Next.js
In an actual app you can reuse most of this code and
structure, except for `next.config.js`, which is only
set up to alias local dependencies to avoid deduplication.

> _Note:_ This example is based on next.js'
> [`withApollo` example.](https://github.com/zeit/next.js/tree/canary/examples/with-apollo)

## Usage

#### 1. Build urql

```bash
cd ../../ && yarn && yarn build
```

#### 2. Install dependencies

```bash
cd examples/3-ssr-with-nextjs && yarn
```

#### 3. Start server

```bash
yarn dev
```

#### 4. Open browser

Navigate to example at [http://localhost:3000/](http://localhost:3000/).
