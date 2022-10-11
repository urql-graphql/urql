---
title: TypeScript integration
order: 7
---

# URQL and TypeScript

URQL, with the help of [GraphQL Code Generator](https://www.the-guild.dev/graphql/codegen), can leverage the typed-design of GraphQL Schemas to generate TypeScript types on the flight.

## Getting started

### Installation

To get and running, install the following packages:

```sh
yarn add graphql
yarn add -D typescript @graphql-codegen/cli @graphql-codegen/client-preset
# or
npm install graphql
npm install -D typescript @graphql-codegen/cli @graphql-codegen/client-preset
```

Then, add the following script to your `package.json`:

```json
{
  "scripts": {
    "codegen": "graphql-codegen"
  }
}
```

Now, let's create a configuration file for our current framework setup:

### Configuration

#### React project configuration

Create the following `codegen.ts` configuration file:

```ts
import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '<YOUR_GRAPHQL_API_URL>',
  documents: ['src/**/*.tsx'],
  ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    './src/gql/': {
      preset: 'client',
      plugins: [],
    },
  },
};

export default config;
```

#### Vue project configuration

Create the following `codegen.ts` configuration file:

```ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '<YOUR_GRAPHQL_API_URL>',
  documents: ['src/**/*.vue'],
  ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    './src/gql/': {
      preset: 'client',
      config: {
        useTypeImports: true,
      },
      plugins: [],
    },
  },
};

export default config;
```

#### Svelte project configuration

Create the following `codegen.ts` configuration file:

```ts
const config: CodegenConfig = {
  schema: '<YOUR_GRAPHQL_API_URL>',
  documents: ['src/**/*.svelte'],
  ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    './src/gql/': {
      preset: 'client',
      plugins: [],
    },
  },
};

export default config;
```

## Typing queries, mutations and subscriptions

Now that your project is properly configured, let's start codegen in watch mode:

```sh
yarn codegen
# or
npm run codegen
```

This will generate a `./src/gql` folder that exposes a `graphql()` function.

Let's use this `graphql()` function to write our GraphQL Queries, Mutations and Subscriptions.

Here, an example with the React bindings, however, the usage remains the same for Vue and Svelte bindings:

```tsx
import React from 'react';
import { useQuery } from '@apollo/client';

import './App.css';
import Film from './Film';
import { graphql } from '../src/gql';

const allFilmsWithVariablesQueryDocument = graphql(/* GraphQL */ `
  query allFilmsWithVariablesQuery($first: Int!) {
    allFilms(first: $first) {
      edges {
        node {
          ...FilmItem
        }
      }
    }
  }
`);

function App() {
  // `data` is typed!
  const { data } = useQuery(allFilmsWithVariablesQueryDocument, { variables: { first: 10 } });
  return (
    <div className="App">
      {data && (
        <ul>
          {data.allFilms?.edges?.map(
            (e, i) => e?.node && <Film film={e?.node} key={`film-${i}`} />
          )}
        </ul>
      )}
    </div>
  );
}

export default App;
```

_Examples with Vue are available [in the GraphQL Code Generator repository](https://github.com/dotansimha/graphql-code-generator/tree/master/examples/front-end/vue/urql)_.

Using the generated `graphql()` function to write your GraphQL document results in instantly typed result and variables for queries, mutations and subscriptions!

Let's now see how to go further with GraphQL fragments.

## Getting further with Fragments

> Using GraphQL Fragments helps to explicitly declaring the data dependencies of your UI component and safely accessing only the data it needs.

Our `<Film>` component relies on the `FilmItem` definition, passed through the `film` props:

```tsx
// ...
import Film from './Film';
import { graphql } from '../src/gql';

const allFilmsWithVariablesQueryDocument = graphql(/* GraphQL */ `
  query allFilmsWithVariablesQuery($first: Int!) {
    allFilms(first: $first) {
      edges {
        node {
          ...FilmItem
        }
      }
    }
  }
`);

function App() {
  // ...
  return (
    <div className="App">
      {data && (
        <ul>
          {data.allFilms?.edges?.map(
            (e, i) => e?.node && <Film film={e?.node} key={`film-${i}`} />
          )}
        </ul>
      )}
    </div>
  );
}
// ...
```

GraphQL Code Generator will help you by exposing helps to retrieve the data required by your component's Fragment.

Again, here is an example with the React bindings:

```tsx
import { FragmentType, useFragment } from './gql/fragment-masking';
import { graphql } from '../src/gql';

// again, we use the generated `graphql()` function to write GraphQL documents 👀
export const FilmFragment = graphql(/* GraphQL */ `
  fragment FilmItem on Film {
    id
    title
    releaseDate
    producers
  }
`);

const Film = (props: {
  // `film` property has the correct type 🎉
  film: FragmentType<typeof FilmFragment>;
}) => {
  // `film` is of type `FilmFragment`, with no extraneous properties ⚡️
  const film = useFragment(FilmFragment, props.film);
  return (
    <div>
      <h3>{film.title}</h3>
      <p>{film.releaseDate}</p>
    </div>
  );
};

export default Film;
```

_Examples with Vue are available [in the GraphQL Code Generator repository](https://github.com/dotansimha/graphql-code-generator/tree/master/examples/front-end/vue/urql)_.

You will notice that our `<Film>` component leverages 2 imports from our generated code (from `../src/gql`): the `FragmentType<T>` type helper and the `useFragment()` function.

- we use `FragmentType<typeof FilmFragment>` to get the corresponding Fragment TypeScript type
- later on, we use `useFragment()` to retrieve the properly film property
