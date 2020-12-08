## About

This is a set of benchmarks assessing the performance of various graphCache operations. The operations are of varying sizes, complexitites, and are accomplished via a singular `urql` client instance. Client has a stubbed out GQL API (fetchExchange) to perform GQL operations against.

## Usage

#### 1. Install dependencies in repo root.

To get started, make sure to install necessary dependencies in the root directory of your clone.

```bash
# In root directory
yarn or npm i
```

#### 2. Run benchmark(s).

The commands to run benchmarks follows a certain syntax:
npm run `ActionQuantityComplexity` => i.e., npm run read500c
read === Action
5000 === Quantity
c === Complex

Action & Quantity are required, but c is optional, as not all operations involve a more complex data structure.

There are two exceptions that don't follow the beformentioned conventions for the commands to run benchmarks. They are `addTodo` & `updateTodo`.
They are simply run as follows:

```
npm run addTodo

npm run updateTodo
```

#### 3. Benchmark Expections

Upon executing a command, `Tachometer` will automatically execute the benchmarks via your default browser. Done 50 times prior to returning benchmark result in the console where the command was launched.
